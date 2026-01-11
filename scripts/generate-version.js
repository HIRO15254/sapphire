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
 * Extract the latest changelog section from CHANGELOG.md
 */
function extractLatestChangelog(changelogContent) {
  // Match the first version section (## [x.x.x] - date or ## [x.x.x])
  // and capture everything until the next version section or end of file
  const lines = changelogContent.split('\n')
  let capturing = false
  const result = []

  for (const line of lines) {
    // Check if this is a version header line
    if (line.match(/^## \[\d+\.\d+\.\d+\]/)) {
      if (capturing) {
        // We hit the next version, stop capturing
        break
      }
      // Start capturing after this header
      capturing = true
      continue
    }

    if (capturing) {
      result.push(line)
    }
  }

  return result.join('\n').trim()
}

function main() {
  // Read package.json
  const packageJsonPath = path.join(rootDir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const version = packageJson.version

  // Read CHANGELOG.md
  const changelogPath = path.join(rootDir, 'CHANGELOG.md')
  let changelog = ''

  if (fs.existsSync(changelogPath)) {
    const changelogContent = fs.readFileSync(changelogPath, 'utf-8')
    changelog = extractLatestChangelog(changelogContent)
  }

  // Generate version.json
  const versionInfo = {
    version,
    buildTime: new Date().toISOString(),
    changelog,
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
  if (changelog) {
    console.log(`Changelog entries: ${changelog.split('\n').length} lines`)
  }
}

main()
