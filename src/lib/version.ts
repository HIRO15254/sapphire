/**
 * Version checking utilities for PWA update detection
 */

export interface ChangelogEntry {
  version: string
  date: string | null
  content: string
}

export interface VersionInfo {
  version: string
  buildTime: string
  changelogs: ChangelogEntry[]
}

const STORAGE_KEY = 'sapphire-app-version'

/** Check for updates every 5 minutes */
export const VERSION_CHECK_INTERVAL = 5 * 60 * 1000

/**
 * Fetch the current version info from the server
 */
export async function fetchVersionInfo(): Promise<VersionInfo | null> {
  try {
    const response = await fetch('/version.json', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as VersionInfo
  } catch (error) {
    console.error('Failed to fetch version info:', error)
    return null
  }
}

/**
 * Get the stored version from localStorage
 */
export function getStoredVersion(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

/**
 * Store the current version in localStorage
 */
export function storeVersion(version: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, version)
}

/**
 * Compare two semantic versions
 * Returns true if newVersion is greater than currentVersion
 */
export function isNewerVersion(
  currentVersion: string,
  newVersion: string
): boolean {
  const current = currentVersion.split('.').map(Number)
  const next = newVersion.split('.').map(Number)

  for (let i = 0; i < Math.max(current.length, next.length); i++) {
    const c = current[i] ?? 0
    const n = next[i] ?? 0
    if (n > c) return true
    if (n < c) return false
  }

  return false
}

/**
 * Filter changelogs to only include versions newer than the stored version
 */
export function getNewChangelogs(
  changelogs: ChangelogEntry[],
  storedVersion: string
): ChangelogEntry[] {
  return changelogs.filter((entry) =>
    isNewerVersion(storedVersion, entry.version)
  )
}
