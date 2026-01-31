/**
 * Linear Webhook Server for workflow automation.
 *
 * Listens for:
 * - Project create/update events (status "AI Queue") → starts new workflow or force-resumes existing
 * - Issue status changes (Done/Rejected) → resumes existing workflow
 * - ProjectUpdate events (/version-up) → triggers version-up workflow
 *
 * Usage:
 *   bun run scripts/linear-webhook-server.ts
 *
 * Environment:
 *   LINEAR_WEBHOOK_SECRET  - Webhook signing secret from Linear settings (required)
 *   WEBHOOK_PORT           - Port to listen on (default: 3001)
 *   PROJECT_DIR            - Project root directory (default: cwd)
 */

import { spawn } from 'node:child_process'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET ?? ''
if (!WEBHOOK_SECRET) {
  console.error('[ERROR] LINEAR_WEBHOOK_SECRET is not set')
  process.exit(1)
}

const PORT = Number(process.env.WEBHOOK_PORT) || 3001
const PROJECT_DIR = resolve(process.env.PROJECT_DIR || process.cwd())
const WORKFLOWS_DIR = join(PROJECT_DIR, '.claude', 'workflows')
const LOGS_DIR = join(PROJECT_DIR, '.claude', 'logs')
const COMMANDS_DIR = join(PROJECT_DIR, '.claude', 'commands')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const TRIGGER_STATUS = 'AI Queue'

const runningSessions = new Map<
  string,
  { pid: number; startedAt: string; prompt: string }
>()

interface LinearWebhookPayload {
  action: string
  type: string
  data: {
    id: string
    // Issue fields
    identifier?: string
    title?: string
    state?: { id: string; name: string; type: string }
    // Project fields
    name?: string
    description?: string
    status?: { id: string; name: string; type: string; color: string }
    url?: string
    // Comment fields
    body?: string
    issueId?: string
    // ProjectUpdate fields
    projectId?: string
  }
  updatedFrom?: {
    stateId?: string // Issue state change
    statusId?: string // Project status change
  }
  webhookTimestamp: number
  url?: string
}

interface WorkflowJson {
  version: string
  workflowType: 'spec' | 'fix' | 'pending'
  specName: string
  summary: string
  teamId: string
  projectId: string
  projectUrl: string
  clarificationIssueId?: string | null
  phases?: {
    requirements: {
      issueId: string
      issueIdentifier: string
      issueUrl: string
    }
    design: { issueId: string; issueIdentifier: string; issueUrl: string }
    tasks: { issueId: string; issueIdentifier: string; issueUrl: string }
    implementation: {
      issueId: string
      issueIdentifier: string
      issueUrl: string
    }
  } | null
  issueId?: string | null
  issueIdentifier?: string | null
  issueUrl?: string | null
  prReviewIssue?: {
    issueId: string
    issueIdentifier: string
    issueUrl: string
  } | null
  taskIssues: Array<{
    taskNumber?: number
    taskId?: string
    issueId: string
    issueIdentifier: string
    issueUrl: string
  }>
  claudeSessionId?: string | null
  waitingFor: string | null
  createdAt: string
}

type PhaseKey = 'requirements' | 'design' | 'tasks' | 'implementation'

interface MatchResult {
  specName: string
  workflowType: 'spec' | 'fix' | 'pending'
  workflowJson: WorkflowJson
  matchedPhase?: PhaseKey
  isTaskIssue: boolean
  isClarification: boolean
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

function verifySignature(
  rawBody: string,
  signature: string | null,
  webhookTimestamp: number,
): boolean {
  if (!signature) return false

  const now = Date.now()
  const diff = Math.abs(now - webhookTimestamp)
  if (diff > 5 * 60 * 1000) {
    console.warn(`[WARN] Webhook timestamp too old: ${diff}ms difference`)
    return false
  }

  const expected = createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Workflow JSON management
// ---------------------------------------------------------------------------

async function loadAllWorkflows(): Promise<Map<string, WorkflowJson>> {
  const workflows = new Map<string, WorkflowJson>()
  try {
    const files = await readdir(WORKFLOWS_DIR)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const specName = file.replace(/\.json$/, '')
      try {
        const content = await readFile(join(WORKFLOWS_DIR, file), 'utf-8')
        const parsed = JSON.parse(content) as WorkflowJson
        workflows.set(specName, parsed)
      } catch {
        // invalid JSON — skip
      }
    }
  } catch {
    // directory doesn't exist yet
  }
  return workflows
}

function findWorkflowByProjectId(
  projectId: string,
  workflows: Map<string, WorkflowJson>,
): { specName: string; workflowJson: WorkflowJson } | null {
  for (const [specName, json] of workflows) {
    if (json.projectId === projectId) return { specName, workflowJson: json }
  }
  return null
}

function projectNameToSpecName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function createInitialWorkflowJson(
  projectId: string,
  projectName: string,
  projectUrl: string,
): Promise<string> {
  const specName = projectNameToSpecName(projectName)
  await mkdir(WORKFLOWS_DIR, { recursive: true })

  const workflowJson: WorkflowJson = {
    version: '2.0',
    workflowType: 'pending',
    specName,
    summary: '',
    teamId: '',
    projectId,
    projectUrl,
    clarificationIssueId: null,
    phases: null,
    issueId: null,
    issueIdentifier: null,
    issueUrl: null,
    taskIssues: [],
    waitingFor: 'init',
    createdAt: new Date().toISOString(),
  }

  const jsonPath = join(WORKFLOWS_DIR, `${specName}.json`)
  await writeFile(jsonPath, JSON.stringify(workflowJson, null, 2), 'utf-8')
  console.log(`[INIT] Created ${jsonPath}`)
  return specName
}

// ---------------------------------------------------------------------------
// Command file loader
// ---------------------------------------------------------------------------

async function loadCommand(
  commandName: string,
  args: string,
): Promise<string> {
  const filePath = join(COMMANDS_DIR, `${commandName}.md`)
  const content = await readFile(filePath, 'utf-8')
  return content.replace(/\$ARGUMENTS/g, args)
}

// ---------------------------------------------------------------------------
// Status dashboard
// ---------------------------------------------------------------------------

async function printStatus(): Promise<void> {
  const workflows = await loadAllWorkflows()

  console.log('')
  console.log('=== WORKFLOW STATUS ===')

  const active = [...workflows.entries()].filter(
    ([, json]) => json.waitingFor !== null,
  )

  // Collect non-workflow sessions (e.g. version-up)
  const extraSessions = [...runningSessions.entries()].filter(
    ([name]) => !workflows.has(name),
  )

  if (active.length === 0 && extraSessions.length === 0) {
    console.log('  (no active workflows)')
  } else {
    console.log(
      `  ${'Spec'.padEnd(28)} ${'Type'.padEnd(8)} ${'WaitingFor'.padEnd(16)} Session`,
    )
    console.log(
      `  ${'─'.repeat(28)} ${'─'.repeat(8)} ${'─'.repeat(16)} ${'─'.repeat(16)}`,
    )
    for (const [specName, json] of active) {
      const running = runningSessions.get(specName)
      const sessionStr = running ? `PID ${running.pid}` : '—'
      console.log(
        `  ${specName.padEnd(28).slice(0, 28)} ${json.workflowType.padEnd(8)} ${(json.waitingFor ?? '').padEnd(16)} ${sessionStr}`,
      )
    }
    for (const [name, session] of extraSessions) {
      console.log(
        `  ${name.padEnd(28).slice(0, 28)} ${'—'.padEnd(8)} ${'running'.padEnd(16)} PID ${session.pid}`,
      )
    }
  }

  console.log('='.repeat(72))
  console.log('')
}

// ---------------------------------------------------------------------------
// Issue matching
// ---------------------------------------------------------------------------

function findMatchingWorkflow(
  issueId: string,
  workflows: Map<string, WorkflowJson>,
): MatchResult | null {
  for (const [specName, json] of workflows) {
    // Clarification issue match
    if (json.clarificationIssueId === issueId) {
      return {
        specName,
        workflowType: json.workflowType,
        workflowJson: json,
        isTaskIssue: false,
        isClarification: true,
      }
    }

    // Fix workflow: match main issue
    if (json.workflowType === 'fix' && json.issueId === issueId) {
      return {
        specName,
        workflowType: 'fix',
        workflowJson: json,
        isTaskIssue: false,
        isClarification: false,
      }
    }

    // PR Review issue match (fix workflow)
    if (json.prReviewIssue?.issueId === issueId) {
      return {
        specName,
        workflowType: json.workflowType,
        workflowJson: json,
        isTaskIssue: false,
        isClarification: false,
      }
    }

    // Spec workflow: match phase issues
    if (json.phases) {
      for (const [phase, info] of Object.entries(json.phases)) {
        if (info.issueId === issueId) {
          return {
            specName,
            workflowType: json.workflowType,
            workflowJson: json,
            matchedPhase: phase as PhaseKey,
            isTaskIssue: false,
            isClarification: false,
          }
        }
      }
    }

    // Task sub-issues (informational — don't trigger resume)
    for (const task of json.taskIssues) {
      if (task.issueId === issueId) {
        return {
          specName,
          workflowType: json.workflowType,
          workflowJson: json,
          isTaskIssue: true,
          isClarification: false,
        }
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Session ID management
// ---------------------------------------------------------------------------

async function getSessionId(specName: string): Promise<string | null> {
  try {
    const content = await readFile(
      join(WORKFLOWS_DIR, `${specName}.json`),
      'utf-8',
    )
    const json = JSON.parse(content) as WorkflowJson
    return json.claudeSessionId ?? null
  } catch {
    return null
  }
}

async function saveSessionId(
  specName: string,
  sessionId: string,
): Promise<void> {
  const jsonPath = join(WORKFLOWS_DIR, `${specName}.json`)
  try {
    const content = await readFile(jsonPath, 'utf-8')
    const json = JSON.parse(content) as WorkflowJson
    json.claudeSessionId = sessionId
    await writeFile(jsonPath, JSON.stringify(json, null, 2), 'utf-8')
    console.log(`[SESSION] Saved session ${sessionId} for ${specName}`)
  } catch (err) {
    console.error(`[ERROR] Failed to save session ID: ${err}`)
  }
}

// ---------------------------------------------------------------------------
// Claude Code invocation
// ---------------------------------------------------------------------------

async function spawnClaude(
  prompt: string,
  opts: { newSessionId: string } | { resumeSessionId: string },
  specName: string,
): Promise<void> {
  // Concurrency check: only one session per spec
  if (runningSessions.has(specName)) {
    const existing = runningSessions.get(specName)!
    console.log(
      `[SKIP] ${specName} already has a running session (pid: ${existing.pid})`,
    )
    return
  }

  const isResume = 'resumeSessionId' in opts
  const sessionFlag = isResume
    ? ['--resume', opts.resumeSessionId]
    : ['--session-id', opts.newSessionId]

  // Put -p LAST so it reads the prompt from stdin (avoids cmd.exe quoting issues)
  const args: string[] = [
    ...sessionFlag,
    '--dangerously-skip-permissions',
    '-p',
  ]

  const label = isResume ? 'RESUME' : 'SPAWN'
  const sid = isResume ? opts.resumeSessionId : opts.newSessionId
  console.log(`[${label}] session=${sid} spec=${specName}`)

  // Set up log file
  await mkdir(LOGS_DIR, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logPath = join(LOGS_DIR, `${specName}-${timestamp}.log`)
  const logStream = createWriteStream(logPath)
  logStream.write(
    `[${new Date().toISOString()}] ${label} ${specName}\n` +
      `session=${sid}\nprompt=${prompt.slice(0, 200)}...\n` +
      `${'─'.repeat(60)}\n`,
  )

  const child = spawn('claude', args, {
    cwd: PROJECT_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    detached: false,
  })

  // Pipe expanded command to stdin
  child.stdin?.write(prompt)
  child.stdin?.end()

  // Pipe stdout/stderr to both console and log file
  child.stdout?.on('data', (data: Buffer) => {
    process.stdout.write(data)
    logStream.write(data)
  })
  child.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(data)
    logStream.write(data)
  })

  if (child.pid) {
    runningSessions.set(specName, {
      pid: child.pid,
      startedAt: new Date().toISOString(),
      prompt: `(stdin: ${prompt.slice(0, 80)}...)`,
    })
    console.log(`[${label}] Log file: ${logPath}`)
    printStatus().catch(() => {})
  }

  child.on('error', (err) => {
    runningSessions.delete(specName)
    const msg = `[ERROR] Failed to spawn claude: ${err.message}`
    console.error(msg)
    logStream.write(`\n${msg}\n`)
    logStream.end()
    printStatus().catch(() => {})
  })

  child.on('exit', (code) => {
    runningSessions.delete(specName)
    const msg = `[${label}] claude exited with code ${code}`
    console.log(msg)
    logStream.write(`\n${'─'.repeat(60)}\n${msg}\n`)
    logStream.end()
    printStatus().catch(() => {})
  })
}

async function spawnClaudeInit(
  projectId: string,
  specName: string,
): Promise<void> {
  const existingId = await getSessionId(specName)
  const command = await loadCommand('linear-workflow-init', projectId)

  if (existingId) {
    // Clarification resume — continue existing session
    await spawnClaude(command, { resumeSessionId: existingId }, specName)
  } else {
    // First time — create session with a pre-generated UUID
    const newId = randomUUID()
    await saveSessionId(specName, newId)
    await spawnClaude(command, { newSessionId: newId }, specName)
  }
}

async function spawnClaudeResume(
  specName: string,
  workflowType: 'spec' | 'fix' | 'pending',
): Promise<void> {
  const existingId = await getSessionId(specName)
  const commandName =
    workflowType === 'fix' ? 'linear-fix-workflow' : 'linear-spec-workflow'
  const command = await loadCommand(commandName, `${specName} を再開`)

  if (existingId) {
    await spawnClaude(command, { resumeSessionId: existingId }, specName)
  } else {
    // Fallback: no session to resume — start fresh
    const newId = randomUUID()
    await saveSessionId(specName, newId)
    await spawnClaude(command, { newSessionId: newId }, specName)
  }
}

async function spawnClaudeForceResume(
  specName: string,
  workflowType: 'spec' | 'fix' | 'pending',
): Promise<void> {
  if (workflowType === 'pending') {
    // Init never completed — re-run init
    const workflows = await loadAllWorkflows()
    const json = workflows.get(specName)
    if (json) {
      await spawnClaudeInit(json.projectId, specName)
    }
    return
  }

  const existingId = await getSessionId(specName)
  const commandName =
    workflowType === 'fix' ? 'linear-fix-workflow' : 'linear-spec-workflow'
  const command = await loadCommand(commandName, `${specName} を強制再開`)

  if (existingId) {
    await spawnClaude(command, { resumeSessionId: existingId }, specName)
  } else {
    const newId = randomUUID()
    await saveSessionId(specName, newId)
    await spawnClaude(command, { newSessionId: newId }, specName)
  }
}

async function spawnClaudeVersionUp(projectId: string): Promise<void> {
  const specName = 'version-up'

  if (runningSessions.has(specName)) {
    const existing = runningSessions.get(specName)!
    console.log(
      `[SKIP] version-up already has a running session (pid: ${existing.pid})`,
    )
    return
  }

  const command = await loadCommand('version-up', projectId)
  const newId = randomUUID()
  await spawnClaude(command, { newSessionId: newId }, specName)
}

// ---------------------------------------------------------------------------
// Event handlers (async background processing — never awaited by the server)
// ---------------------------------------------------------------------------

async function processProjectEvent(
  payload: LinearWebhookPayload,
): Promise<void> {
  const projectId = payload.data.id
  const projectName = payload.data.name ?? 'unknown'
  const statusName = payload.data.status?.name

  if (payload.action === 'create') {
    console.log(
      `[EVENT] Project created: "${projectName}" (status: ${statusName ?? 'unknown'})`,
    )
  } else if (payload.action === 'update') {
    if (!payload.updatedFrom?.statusId) return
    console.log(
      `[EVENT] Project "${projectName}" status changed → ${statusName}`,
    )
  } else {
    return
  }

  if (statusName !== TRIGGER_STATUS) {
    console.log(
      `[SKIP] Project "${projectName}" status is "${statusName}", not "${TRIGGER_STATUS}"`,
    )
    return
  }

  // Check if this project already has a workflow → force resume
  const workflows = await loadAllWorkflows()
  const existing = findWorkflowByProjectId(projectId, workflows)

  if (existing) {
    console.log(
      `[FORCE RESUME] ${existing.specName} (${existing.workflowJson.workflowType}) triggered by AI Queue re-assignment`,
    )
    await spawnClaudeForceResume(
      existing.specName,
      existing.workflowJson.workflowType,
    )
    return
  }

  // New project — create initial workflow
  const projectUrl = payload.data.url ?? payload.url ?? ''
  const specName = await createInitialWorkflowJson(
    projectId,
    projectName,
    projectUrl,
  )
  console.log(
    `[INIT] Spawning Claude for project "${projectName}" (spec: ${specName})`,
  )
  await spawnClaudeInit(projectId, specName)
}

async function processIssueEvent(payload: LinearWebhookPayload): Promise<void> {
  if (payload.action !== 'update') return
  if (!payload.updatedFrom?.stateId) return

  const stateObj = payload.data.state as
    | { id: string; name: string; type: string }
    | undefined
  const stateName = stateObj?.name
  const stateType = stateObj?.type

  const isCompleted = stateType === 'completed'
  const isRejected = stateName === 'Rejected' || stateType === 'canceled'

  if (!isCompleted && !isRejected) return

  console.log(
    `[EVENT] Issue ${payload.data.identifier} "${payload.data.title}" → ${stateName} (${stateType})`,
  )

  const workflows = await loadAllWorkflows()
  const match = findMatchingWorkflow(payload.data.id, workflows)

  if (!match) {
    console.log(
      `[SKIP] No matching workflow for issue ${payload.data.identifier}`,
    )
    return
  }

  if (match.isTaskIssue) {
    console.log(
      `[SKIP] Task sub-issue ${payload.data.identifier} in ${match.specName}`,
    )
    return
  }

  if (!match.workflowJson.waitingFor) {
    console.log(
      `[SKIP] ${match.specName} has no waitingFor — not in waiting state`,
    )
    return
  }

  const label = isCompleted ? 'APPROVED' : 'REJECTED'
  const detail = match.isClarification
    ? 'clarification'
    : (match.matchedPhase ?? 'main')
  console.log(
    `[${label}] ${match.specName} (${match.workflowType}) — ${detail}`,
  )

  if (match.isClarification) {
    await spawnClaudeInit(match.workflowJson.projectId, match.specName)
  } else {
    await spawnClaudeResume(match.specName, match.workflowType)
  }
}

const VERSION_UP_TRIGGER = '/version-up'

async function processProjectUpdateEvent(
  payload: LinearWebhookPayload,
): Promise<void> {
  if (payload.action !== 'create') return

  const body = (payload.data.body ?? '').trim()
  const projectId = payload.data.projectId
  if (!projectId) return

  // Handle /version-up command
  if (body.startsWith(VERSION_UP_TRIGGER)) {
    console.log(`[VERSION-UP] Triggered via project update on ${projectId}`)
    await spawnClaudeVersionUp(projectId)
    return
  }
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

async function handleWebhook(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawBody = await req.text()
  let payload: LinearWebhookPayload

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const signature = req.headers.get('linear-signature')
  if (!verifySignature(rawBody, signature, payload.webhookTimestamp)) {
    console.warn('[WARN] Invalid webhook signature — rejecting')
    return new Response('Invalid signature', { status: 401 })
  }

  // Respond immediately, process in background
  if (payload.type === 'Project') {
    processProjectEvent(payload).catch((err) =>
      console.error('[ERROR] processProjectEvent failed:', err),
    )
  } else if (payload.type === 'Issue') {
    processIssueEvent(payload).catch((err) =>
      console.error('[ERROR] processIssueEvent failed:', err),
    )
  } else if (payload.type === 'ProjectUpdate') {
    processProjectUpdateEvent(payload).catch((err) =>
      console.error('[ERROR] processProjectUpdateEvent failed:', err),
    )
  }

  return new Response('OK', { status: 200 })
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  async fetch(req) {
    const reqUrl = new URL(req.url)

    if (reqUrl.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', port: PORT }), {
        headers: { 'content-type': 'application/json' },
      })
    }

    if (reqUrl.pathname === '/webhook/linear') {
      return handleWebhook(req)
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`[LINEAR WEBHOOK] Listening on http://0.0.0.0:${PORT}`)
console.log(
  `[LINEAR WEBHOOK] Endpoint: POST http://<host>:${PORT}/webhook/linear`,
)
console.log(`[LINEAR WEBHOOK] Project dir: ${PROJECT_DIR}`)
console.log(`[LINEAR WEBHOOK] Workflows dir: ${WORKFLOWS_DIR}`)
printStatus().catch(() => {})
