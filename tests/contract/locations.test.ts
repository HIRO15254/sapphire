import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import { db } from "@/server/db";
import { locations, pokerSessions, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
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

describe("locations router - Contract Tests", () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(pokerSessions);
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
    it("should return empty array when no locations", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.locations.getAll({});

      expect(result).toEqual([]);
    });

    it("should return user-scoped locations only", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      // Create locations for both users
      await caller1.locations.create({ name: "渋谷ポーカー" });
      await caller1.locations.create({ name: "アキバポーカー" });
      await caller2.locations.create({ name: "新宿ポーカー" });

      const user1Locations = await caller1.locations.getAll({});
      const user2Locations = await caller2.locations.getAll({});

      expect(user1Locations).toHaveLength(2);
      expect(user2Locations).toHaveLength(1);
      expect(user1Locations.every((l) => l.userId === mockUser1.id)).toBe(true);
      expect(user2Locations.every((l) => l.userId === mockUser2.id)).toBe(true);
    });

    it("should order by name ASC", async () => {
      const caller = createCaller(mockSession1);

      await caller.locations.create({ name: "Zebra" });
      await caller.locations.create({ name: "Apple" });
      await caller.locations.create({ name: "Mango" });

      const locs = await caller.locations.getAll({});

      expect(locs[0]?.name).toBe("Apple");
      expect(locs[1]?.name).toBe("Mango");
      expect(locs[2]?.name).toBe("Zebra");
    });

    it("should include sessionCount in results", async () => {
      const caller = createCaller(mockSession1);

      const location = await caller.locations.create({ name: "テスト場所" });

      // Create 2 sessions with this location
      await db.insert(pokerSessions).values([
        {
          userId: mockUser1.id,
          date: new Date(),
          locationId: location.id,
          buyIn: "10000",
          cashOut: "15000",
          durationMinutes: 180,
        },
        {
          userId: mockUser1.id,
          date: new Date(),
          locationId: location.id,
          buyIn: "5000",
          cashOut: "8000",
          durationMinutes: 120,
        },
      ]);

      const locs = await caller.locations.getAll({});

      expect(locs[0]).toHaveProperty("sessionCount");
      expect(locs[0]?.sessionCount).toBe(2);
    });

    it("should support search filtering (partial match)", async () => {
      const caller = createCaller(mockSession1);

      await caller.locations.create({ name: "渋谷ポーカー" });
      await caller.locations.create({ name: "新宿ポーカー" });
      await caller.locations.create({ name: "渋谷カジノ" });

      const filtered = await caller.locations.getAll({ search: "渋谷" });

      expect(filtered).toHaveLength(2);
      expect(filtered.every((l) => l.name.includes("渋谷"))).toBe(true);
    });

    it("should support case-insensitive search", async () => {
      const caller = createCaller(mockSession1);

      await caller.locations.create({ name: "SHIBUYA POKER" });
      await caller.locations.create({ name: "Akihabara Poker" });

      const filtered = await caller.locations.getAll({ search: "poker" });

      expect(filtered).toHaveLength(2);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.locations.getAll()).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("create procedure", () => {
    it("should create a location with correct structure", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.locations.create({ name: "渋谷ポーカー" });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("userId", mockUser1.id);
      expect(result).toHaveProperty("name", "渋谷ポーカー");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });

    it("should trim whitespace from name", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.locations.create({ name: "  渋谷ポーカー  " });

      expect(result.name).toBe("渋谷ポーカー");
    });

    it("should reject empty name after trimming", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.locations.create({ name: "   " })).rejects.toThrow();
    });

    it("should reject name longer than 100 characters", async () => {
      const caller = createCaller(mockSession1);

      const longName = "a".repeat(101);
      await expect(caller.locations.create({ name: longName })).rejects.toThrow();
    });

    it("should return existing location if duplicate name (case-insensitive)", async () => {
      const caller = createCaller(mockSession1);

      const first = await caller.locations.create({ name: "Shibuya Poker" });
      const second = await caller.locations.create({ name: "Shibuya Poker" });
      const third = await caller.locations.create({ name: "SHIBUYA POKER" });

      // Exact duplicate should return same ID
      expect(second.id).toBe(first.id);
      // Case-insensitive duplicate should also return same ID
      expect(third.id).toBe(first.id);
    });

    it("should allow same name for different users", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const location1 = await caller1.locations.create({ name: "共通ポーカー" });
      const location2 = await caller2.locations.create({ name: "共通ポーカー" });

      expect(location1.id).not.toBe(location2.id);
      expect(location1.userId).toBe(mockUser1.id);
      expect(location2.userId).toBe(mockUser2.id);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.locations.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("delete procedure (FR-020)", () => {
    it("should delete location and reassign sessions to default", async () => {
      const caller = createCaller(mockSession1);

      // Create a location
      const location = await caller.locations.create({ name: "削除予定の場所" });

      // Create 2 sessions with this location
      await db.insert(pokerSessions).values([
        {
          userId: mockUser1.id,
          date: new Date(),
          locationId: location.id,
          buyIn: "10000",
          cashOut: "15000",
          durationMinutes: 180,
        },
        {
          userId: mockUser1.id,
          date: new Date(),
          locationId: location.id,
          buyIn: "5000",
          cashOut: "8000",
          durationMinutes: 120,
        },
      ]);

      // Delete the location
      const result = await caller.locations.delete({ id: location.id });

      expect(result.success).toBe(true);
      expect(result.affectedSessions).toBe(2);

      // Verify location was deleted
      const locs = await caller.locations.getAll({});
      const deleted = locs.find((l) => l.id === location.id);
      expect(deleted).toBeUndefined();

      // Verify default location exists
      const defaultLocation = locs.find((l) => l.name === "削除された場所");
      expect(defaultLocation).toBeDefined();

      // Verify sessions were reassigned
      const sessions = await db
        .select()
        .from(pokerSessions)
        .where(eq(pokerSessions.userId, mockUser1.id));

      expect(sessions).toHaveLength(2);
      expect(sessions.every((s) => s.locationId === defaultLocation?.id)).toBe(true);
    });

    it("should prevent deletion of default location", async () => {
      const caller = createCaller(mockSession1);

      // Create default location
      const defaultLoc = await caller.locations.create({ name: "削除された場所" });

      // Try to delete it
      await expect(caller.locations.delete({ id: defaultLoc.id })).rejects.toThrow(
        "システムデフォルト場所は削除できません"
      );
    });

    it("should throw error for non-existent location", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.locations.delete({ id: 99999 })).rejects.toThrow("場所が見つかりません");
    });

    it("should prevent deleting other user's location", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const location = await caller1.locations.create({ name: "User1の場所" });

      await expect(caller2.locations.delete({ id: location.id })).rejects.toThrow(
        "場所が見つかりません"
      );

      // Verify location still exists
      const locs = await caller1.locations.getAll({});
      const stillExists = locs.find((l) => l.id === location.id);
      expect(stillExists).toBeDefined();
    });

    it("should handle deletion when location has no sessions", async () => {
      const caller = createCaller(mockSession1);

      const location = await caller.locations.create({ name: "未使用の場所" });

      const result = await caller.locations.delete({ id: location.id });

      expect(result.success).toBe(true);
      expect(result.affectedSessions).toBe(0);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.locations.delete({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });
});
