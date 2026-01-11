/**
 * Script to generate version.json from package.json and CHANGELOG.md
 *
 * Run during build process: node scripts/generate-version.js
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

/**
 * Extract all changelog entries from CHANGELOG.md
 * Returns an array of { version, date, content } objects
 */
function extractAllChangelogs(changelogContent) {
  const lines = changelogContent.split('\n')
  const entries = []
  let currentEntry = null

  for (const line of lines) {
    // Check if this is a version header line: ## [x.x.x] - date or ## [x.x.x]
    const versionMatch = line.match(/^## \[(\d+\.\d+\.\d+)\](?:\s*-\s*(.+))?/)

    if (versionMatch) {
      // Save the previous entry if exists
      if (currentEntry) {
        currentEntry.content = currentEntry.content.trim()
        entries.push(currentEntry)
      }

      // Start a new entry
      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2]?.trim() || null,
        content: '',
      }
      continue
    }

    // Add line to current entry
    if (currentEntry) {
      currentEntry.content += line + '\n'
    }
  }

  // Don't forget the last entry
  if (currentEntry) {
    currentEntry.content = currentEntry.content.trim()
    entries.push(currentEntry)
  }

  return entries
}

function main() {
  // Read package.json
  const packageJsonPath = path.join(rootDir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const version = packageJson.version

  // Read CHANGELOG.md
  const changelogPath = path.join(rootDir, 'CHANGELOG.md')
  let changelogs = []

  if (fs.existsSync(changelogPath)) {
    const changelogContent = fs.readFileSync(changelogPath, 'utf-8')
    changelogs = extractAllChangelogs(changelogContent)
  }

  // Generate version.json
  const versionInfo = {
    version,
    buildTime: new Date().toISOString(),
    changelogs,
  }

  // Ensure public directory exists
  const publicDir = path.join(rootDir, 'public')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  const outputPath = path.join(publicDir, 'version.json')
  fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2))

  console.log(`Generated version.json: v${version}`)
  console.log(`Build time: ${versionInfo.buildTime}`)
  console.log(`Changelog entries: ${changelogs.length} versions`)
}

main()
