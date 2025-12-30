import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'
import { pgTableCreator, type timestamp } from 'drizzle-orm/pg-core'

/**
 * Multi-project schema prefix for Drizzle ORM.
 * All tables will be prefixed with 'sapphire_' to avoid conflicts.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sapphire_${name}`)

/**
 * Timestamps mixin columns for all entities.
 * Provides createdAt, updatedAt, and optional deletedAt for soft delete.
 *
 * Usage:
 * ```typescript
 * export const myTable = createTable('my_table', (d) => ({
 *   id: d.uuid().primaryKey().defaultRandom(),
 *   name: d.varchar({ length: 255 }),
 *   ...timestampColumns(d),
 * }))
 * ```
 */
export const timestampColumns = <T extends { timestamp: typeof timestamp }>(
  d: T,
) => ({
  createdAt: d
    .timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: d
    .timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: d.timestamp('deleted_at', { withTimezone: true }),
})

/**
 * Helper function to filter out soft-deleted records.
 * Use in WHERE clauses to exclude records where deletedAt is not null.
 *
 * Usage:
 * ```typescript
 * const activeUsers = await db
 *   .select()
 *   .from(users)
 *   .where(isNotDeleted(users.deletedAt))
 * ```
 *
 * @param deletedAtColumn - The deletedAt column to check
 * @returns SQL condition that filters to only non-deleted records
 */
export function isNotDeleted(deletedAtColumn: PgColumn): SQL {
  return sql`${deletedAtColumn} IS NULL`
}

/**
 * Helper function to mark a record as soft-deleted.
 * Returns the current timestamp for use in update queries.
 *
 * Usage:
 * ```typescript
 * await db
 *   .update(users)
 *   .set({ deletedAt: softDelete() })
 *   .where(eq(users.id, userId))
 * ```
 *
 * @returns Current Date for soft delete timestamp
 */
export function softDelete(): Date {
  return new Date()
}

/**
 * Type helper for tables with timestamp columns.
 * Use this when you need to type a table that includes the timestamp mixin.
 */
export type WithTimestamps = {
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
