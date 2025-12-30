/**
 * Playwright Global Setup
 *
 * This file runs once before all E2E tests.
 * It sets up the test database by cleaning all tables.
 */

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

/**
 * Get test database URL from environment.
 */
function getTestDatabaseUrl(): string {
  // E2E tests should use TEST_DATABASE_URL
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL
  }

  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) {
    throw new Error(
      'DATABASE_URL or TEST_DATABASE_URL environment variable is required for E2E tests',
    )
  }

  // Parse and modify the database name to add '_test' suffix
  const url = new URL(baseUrl)
  const pathParts = url.pathname.split('/')
  const dbName = pathParts[pathParts.length - 1] ?? ''

  if (dbName && !dbName.endsWith('_test')) {
    pathParts[pathParts.length - 1] = `${dbName}_test`
    url.pathname = pathParts.join('/')
  }

  return url.toString()
}

/**
 * Clean all tables in the test database.
 */
async function cleanTestDatabase(): Promise<void> {
  const testUrl = getTestDatabaseUrl()
  console.log(`[E2E Setup] Connecting to test database...`)

  const conn = postgres(testUrl)
  const db = drizzle(conn)

  try {
    // Get all table names with the sapphire_ prefix
    const tables = await db.execute<{ tablename: string }>(sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'sapphire_%'
    `)

    if (tables.length === 0) {
      console.log(
        '[E2E Setup] No tables found. Make sure migrations have been run on the test database.',
      )
      console.log(
        `[E2E Setup] Run: TEST_DATABASE_URL="${testUrl}" bun run db:push`,
      )
      return
    }

    // Truncate all tables
    console.log(`[E2E Setup] Cleaning ${tables.length} tables...`)
    for (const { tablename } of tables) {
      await db.execute(sql.raw(`TRUNCATE TABLE "${tablename}" CASCADE`))
    }
    console.log('[E2E Setup] Test database cleaned successfully')
  } finally {
    await conn.end()
  }
}

export default async function globalSetup(): Promise<void> {
  console.log('[E2E Setup] Starting global setup...')
  await cleanTestDatabase()
  console.log('[E2E Setup] Global setup complete')
}
