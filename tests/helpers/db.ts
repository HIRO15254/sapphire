/**
 * Database helpers for integration tests.
 *
 * These helpers provide utilities for setting up and tearing down
 * test databases with proper isolation between test runs.
 */

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '~/server/db/schema'

/**
 * Get test database URL.
 * Uses TEST_DATABASE_URL if set, otherwise appends '_test' to DATABASE_URL.
 */
export function getTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL
  }

  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) {
    throw new Error(
      'DATABASE_URL or TEST_DATABASE_URL environment variable is required for database tests',
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
 * Create a test database connection.
 */
export function createTestDb() {
  const testUrl = getTestDatabaseUrl()
  const conn = postgres(testUrl)
  return drizzle(conn, { schema })
}

/**
 * Clean all tables in the test database.
 * This should be called before each test that needs a fresh database state.
 */
export async function cleanTestDatabase(
  db: ReturnType<typeof createTestDb>,
): Promise<void> {
  // Get all table names with the sapphire_ prefix
  const tables = await db.execute<{ tablename: string }>(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'sapphire_%'
  `)

  // Truncate all tables (faster than dropping and recreating)
  for (const { tablename } of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${tablename}" CASCADE`))
  }
}

/**
 * Seed the test database with initial data.
 * Override this function in specific test files if custom seed data is needed.
 */
export async function seedTestDatabase(
  db: ReturnType<typeof createTestDb>,
): Promise<void> {
  // Default seed: no data (tests should create their own data)
  // This can be extended in the future if common test data is needed
}

/**
 * Setup test database with clean state.
 * Returns the database instance for use in tests.
 */
export async function setupTestDatabase(): Promise<
  ReturnType<typeof createTestDb>
> {
  const db = createTestDb()
  await cleanTestDatabase(db)
  await seedTestDatabase(db)
  return db
}

/**
 * Close test database connection.
 */
export async function closeTestDatabase(
  db: ReturnType<typeof createTestDb>,
): Promise<void> {
  // postgres-js doesn't have a close method exposed through drizzle
  // The connection pool will be cleaned up automatically
}
