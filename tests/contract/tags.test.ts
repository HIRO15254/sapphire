import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import { db } from "@/server/db";
import { locations, pokerSessions, sessionTags, tags, users } from "@/server/db/schema";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it } from "vitest";

// Test users
const mockUser1: Session["user"] = {
  id: "test-user-1",
  name: "Test User 1",
  email: "user1@test.com",
};

const mockUser2: Session["user"] = {
  id: "test-user-2",
  name: "Test User 2",
  email: "user2@test.com",
};

const mockSession1: Session = {
  user: mockUser1,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const mockSession2: Session = {
  user: mockUser2,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Helper to create tRPC caller
function createCaller(session: Session | null) {
  const ctx = createInnerTRPCContext({ session });
  return appRouter.createCaller(ctx);
}

describe("tags router - Contract Tests", () => {
  beforeEach(async () => {
    // Clean up test data in correct order
    await db.delete(sessionTags);
    await db.delete(pokerSessions);
    await db.delete(tags);
    await db.delete(locations);

    // Ensure test users exist
    await db
      .insert(users)
      .values([
        {
          id: mockUser1.id,
          name: mockUser1.name,
          email: mockUser1.email!,
        },
        {
          id: mockUser2.id,
          name: mockUser2.name,
          email: mockUser2.email!,
        },
      ])
      .onConflictDoNothing();
  });

  describe("getAll procedure", () => {
    it("should return empty array when no tags", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.tags.getAll({});

      expect(result).toEqual([]);
    });

    it("should return user-scoped tags only", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      // Create tags for both users
      await caller1.tags.create({ name: "トーナメント" });
      await caller1.tags.create({ name: "キャッシュゲーム" });
      await caller2.tags.create({ name: "ハイステークス" });

      const user1Tags = await caller1.tags.getAll({});
      const user2Tags = await caller2.tags.getAll({});

      expect(user1Tags).toHaveLength(2);
      expect(user2Tags).toHaveLength(1);
      expect(user1Tags.every((t) => t.userId === mockUser1.id)).toBe(true);
      expect(user2Tags.every((t) => t.userId === mockUser2.id)).toBe(true);
    });

    it("should order by name ASC", async () => {
      const caller = createCaller(mockSession1);

      await caller.tags.create({ name: "Zebra" });
      await caller.tags.create({ name: "Apple" });
      await caller.tags.create({ name: "Mango" });

      const allTags = await caller.tags.getAll({});

      expect(allTags[0]?.name).toBe("Apple");
      expect(allTags[1]?.name).toBe("Mango");
      expect(allTags[2]?.name).toBe("Zebra");
    });

    it("should include sessionCount in results", async () => {
      const caller = createCaller(mockSession1);

      const tag = await caller.tags.create({ name: "テストタグ" });
      const location = await caller.locations.create({ name: "テスト場所" });

      // Create sessions and associate with tag
      const session1 = await db
        .insert(pokerSessions)
        .values({
          userId: mockUser1.id,
          date: new Date(),
          locationId: location.id,
          buyIn: "10000",
          cashOut: "15000",
          durationMinutes: 180,
        })
        .returning();

      const session2 = await db
        .insert(pokerSessions)
        .values({
          userId: mockUser1.id,
          date: new Date(),
          locationId: location.id,
          buyIn: "5000",
          cashOut: "8000",
          durationMinutes: 120,
        })
        .returning();

      // Associate tag with both sessions
      await db.insert(sessionTags).values([
        { sessionId: session1[0]!.id, tagId: tag.id },
        { sessionId: session2[0]!.id, tagId: tag.id },
      ]);

      const allTags = await caller.tags.getAll({});

      expect(allTags[0]).toHaveProperty("sessionCount");
      expect(allTags[0]?.sessionCount).toBe(2);
    });

    it("should support search filtering (partial match)", async () => {
      const caller = createCaller(mockSession1);

      await caller.tags.create({ name: "トーナメント形式" });
      await caller.tags.create({ name: "キャッシュゲーム" });
      await caller.tags.create({ name: "トーナメント決勝" });

      const filtered = await caller.tags.getAll({ search: "トーナメント" });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.name.includes("トーナメント"))).toBe(true);
    });

    it("should support case-insensitive search", async () => {
      const caller = createCaller(mockSession1);

      await caller.tags.create({ name: "TOURNAMENT" });
      await caller.tags.create({ name: "Cash Game" });

      const filtered = await caller.tags.getAll({ search: "tournament" });

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.name).toBe("TOURNAMENT");
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.tags.getAll()).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("create procedure", () => {
    it("should create a tag with correct structure", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.tags.create({ name: "トーナメント" });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("userId", mockUser1.id);
      expect(result).toHaveProperty("name", "トーナメント");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });

    it("should trim whitespace from name", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.tags.create({ name: "  トーナメント  " });

      expect(result.name).toBe("トーナメント");
    });

    it("should reject empty name after trimming", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.tags.create({ name: "   " })).rejects.toThrow();
    });

    it("should reject name longer than 50 characters", async () => {
      const caller = createCaller(mockSession1);

      const longName = "a".repeat(51);
      await expect(caller.tags.create({ name: longName })).rejects.toThrow();
    });

    it("should return existing tag if duplicate name (case-insensitive)", async () => {
      const caller = createCaller(mockSession1);

      const first = await caller.tags.create({ name: "Tournament" });
      const second = await caller.tags.create({ name: "Tournament" });
      const third = await caller.tags.create({ name: "TOURNAMENT" });

      // Exact duplicate should return same ID
      expect(second.id).toBe(first.id);
      // Case-insensitive duplicate should also return same ID
      expect(third.id).toBe(first.id);
    });

    it("should allow same name for different users", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const tag1 = await caller1.tags.create({ name: "共通タグ" });
      const tag2 = await caller2.tags.create({ name: "共通タグ" });

      expect(tag1.id).not.toBe(tag2.id);
      expect(tag1.userId).toBe(mockUser1.id);
      expect(tag2.userId).toBe(mockUser2.id);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.tags.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("delete procedure (FR-021)", () => {
    it("should delete tag and cascade session associations", async () => {
      const caller = createCaller(mockSession1);

      // Create a tag
      const tag = await caller.tags.create({ name: "削除予定タグ" });
      const location = await caller.locations.create({ name: "テスト場所" });

      // Create 2 sessions
      const session1 = await db
        .insert(pokerSessions)
        .values({
          userId: mockUser1.id,
          date: new Date(),
          locationId: location.id,
          buyIn: "10000",
          cashOut: "15000",
          durationMinutes: 180,
        })
        .returning();

      const session2 = await db
        .insert(pokerSessions)
        .values({
          userId: mockUser1.id,
          date: new Date(),
          locationId: location.id,
          buyIn: "5000",
          cashOut: "8000",
          durationMinutes: 120,
        })
        .returning();

      // Associate tag with both sessions
      await db.insert(sessionTags).values([
        { sessionId: session1[0]!.id, tagId: tag.id },
        { sessionId: session2[0]!.id, tagId: tag.id },
      ]);

      // Delete the tag
      const result = await caller.tags.delete({ id: tag.id });

      expect(result.success).toBe(true);
      expect(result.affectedSessions).toBe(2);

      // Verify tag was deleted
      const allTags = await caller.tags.getAll({});
      const deleted = allTags.find((t) => t.id === tag.id);
      expect(deleted).toBeUndefined();

      // Verify sessions still exist (not deleted)
      const sessions = await caller.sessions.getAll({});
      expect(sessions).toHaveLength(2);

      // Verify session_tags associations were cascaded (deleted)
      const associations = await db.select().from(sessionTags);
      expect(associations).toHaveLength(0);
    });

    it("should throw error for non-existent tag", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.tags.delete({ id: 99999 })).rejects.toThrow("タグが見つかりません");
    });

    it("should prevent deleting other user's tag", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const tag = await caller1.tags.create({ name: "User1のタグ" });

      await expect(caller2.tags.delete({ id: tag.id })).rejects.toThrow("タグが見つかりません");

      // Verify tag still exists
      const allTags = await caller1.tags.getAll({});
      const stillExists = allTags.find((t) => t.id === tag.id);
      expect(stillExists).toBeDefined();
    });

    it("should handle deletion when tag has no sessions", async () => {
      const caller = createCaller(mockSession1);

      const tag = await caller.tags.create({ name: "未使用タグ" });

      const result = await caller.tags.delete({ id: tag.id });

      expect(result.success).toBe(true);
      expect(result.affectedSessions).toBe(0);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.tags.delete({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });
});
