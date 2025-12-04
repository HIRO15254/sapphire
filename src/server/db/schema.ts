import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sapphire_${name}`);

// Authentication tables (NextAuth.js)
export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  pokerSessions: many(pokerSessions),
  locations: many(locations),
  tags: many(tags),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)]
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// Location table (for poker session locations)
export const locations = createTable(
  "location",
  (d) => ({
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 255 }).notNull(),
    createdAt: d.timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("location_user_id_idx").on(t.userId),
    // Unique constraint on userId + name (case-sensitivity handled in application layer)
    uniqueIndex("location_user_name_unique").on(t.userId, t.name),
  ]
);

export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  pokerSessions: many(pokerSessions),
}));

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

// Tag table (for poker session tags)
export const tags = createTable(
  "tag",
  (d) => ({
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 50 }).notNull(),
    createdAt: d.timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("tag_user_id_idx").on(t.userId),
    // Unique constraint on userId + name (case-sensitivity handled in application layer)
    uniqueIndex("tag_user_name_unique").on(t.userId, t.name),
  ]
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  sessionTags: many(sessionTags),
}));

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

// Session-Tag junction table (many-to-many)
export const sessionTags = createTable(
  "session_tag",
  (d) => ({
    sessionId: d
      .integer()
      .notNull()
      .references(() => pokerSessions.id, { onDelete: "cascade" }),
    tagId: d
      .integer()
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  }),
  (t) => [
    primaryKey({ columns: [t.sessionId, t.tagId] }),
    index("session_tag_tag_id_idx").on(t.tagId),
  ]
);

export const sessionTagsRelations = relations(sessionTags, ({ one }) => ({
  session: one(pokerSessions, {
    fields: [sessionTags.sessionId],
    references: [pokerSessions.id],
  }),
  tag: one(tags, {
    fields: [sessionTags.tagId],
    references: [tags.id],
  }),
}));

// Poker Session table
export const pokerSessions = createTable(
  "poker_session",
  (d) => ({
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
    locationId: d
      .integer()
      .notNull()
      .references(() => locations.id),
    buyIn: d.numeric({ precision: 10, scale: 2 }).notNull(),
    cashOut: d.numeric({ precision: 10, scale: 2 }).notNull(),
    durationMinutes: d.integer().notNull(),
    notes: d.text(), // HTML string
    createdAt: d.timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("session_user_date_idx").on(t.userId, t.date.desc()),
    index("session_user_location_idx").on(t.userId, t.locationId),
    index("session_user_date_location_idx").on(t.userId, t.date, t.locationId),
  ]
);

export const pokerSessionsRelations = relations(pokerSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [pokerSessions.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [pokerSessions.locationId],
    references: [locations.id],
  }),
  sessionTags: many(sessionTags),
}));

export type PokerSession = typeof pokerSessions.$inferSelect;
export type NewPokerSession = typeof pokerSessions.$inferInsert;
