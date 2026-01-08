import { index, unique } from 'drizzle-orm/pg-core'

import { createTable } from './common'
import { players } from './player'
import { playerTags } from './playerTag'

/**
 * PlayerTagAssignment schema for many-to-many relationship.
 *
 * Junction table linking players to their assigned tags.
 * A player can have multiple tags, and a tag can be assigned
 * to multiple players.
 *
 * @see data-model.md Section 18. PlayerTagAssignment
 */
export const playerTagAssignments = createTable(
  'player_tag_assignment',
  (d) => ({
    id: d
      .varchar('id', { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /**
     * The player being tagged.
     * Cascades on delete to remove assignment when player is deleted.
     */
    playerId: d
      .varchar('player_id', { length: 255 })
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    /**
     * The tag being assigned.
     * Cascades on delete to remove assignment when tag is deleted.
     */
    tagId: d
      .varchar('tag_id', { length: 255 })
      .notNull()
      .references(() => playerTags.id, { onDelete: 'cascade' }),
    /**
     * When the assignment was created.
     */
    createdAt: d
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index('player_tag_assignment_player_id_idx').on(t.playerId),
    index('player_tag_assignment_tag_id_idx').on(t.tagId),
    unique('player_tag_assignment_unique').on(t.playerId, t.tagId),
  ],
)

// Type exports
export type PlayerTagAssignment = typeof playerTagAssignments.$inferSelect
export type NewPlayerTagAssignment = typeof playerTagAssignments.$inferInsert
