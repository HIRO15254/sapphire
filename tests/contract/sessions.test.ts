import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import { db } from "@/server/db";
import { pokerSessions, users } from "@/server/db/schema";
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

// Test data
const validSessionData = {
  date: new Date("2025-10-21T18:00:00+09:00"),
  location: "ポーカースタジアム渋谷",
  buyIn: 10000,
  cashOut: 15000,
  durationMinutes: 180,
  notes: "良いセッションだった",
};

describe("sessions router - Contract Tests", () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(pokerSessions);

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

  describe("create procedure", () => {
    it("should create a session with correct structure", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.sessions.create(validSessionData);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("userId", mockUser1.id);
      expect(result).toHaveProperty("profit");
      expect(result.profit).toBe(5000); // cashOut - buyIn
      expect(result.location).toBe("ポーカースタジアム渋谷");
      expect(result.durationMinutes).toBe(180);
    });

    it("should calculate profit correctly", async () => {
      const caller = createCaller(mockSession1);

      // Winning session
      const winning = await caller.sessions.create({
        ...validSessionData,
        buyIn: 10000,
        cashOut: 15000,
      });
      expect(winning.profit).toBe(5000);

      // Losing session
      const losing = await caller.sessions.create({
        ...validSessionData,
        buyIn: 20000,
        cashOut: 12000,
      });
      expect(losing.profit).toBe(-8000);

      // Break-even session
      const breakEven = await caller.sessions.create({
        ...validSessionData,
        buyIn: 10000,
        cashOut: 10000,
      });
      expect(breakEven.profit).toBe(0);
    });

    it("should reject negative buyIn", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.sessions.create({
          ...validSessionData,
          buyIn: -1000,
        })
      ).rejects.toThrow();
    });

    it("should reject negative cashOut", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.sessions.create({
          ...validSessionData,
          cashOut: -500,
        })
      ).rejects.toThrow();
    });

    it("should reject empty location", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.sessions.create({
          ...validSessionData,
          location: "",
        })
      ).rejects.toThrow();
    });

    it("should reject non-positive duration", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.sessions.create({
          ...validSessionData,
          durationMinutes: 0,
        })
      ).rejects.toThrow();

      await expect(
        caller.sessions.create({
          ...validSessionData,
          durationMinutes: -30,
        })
      ).rejects.toThrow();
    });

    it("should trim whitespace from location", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.sessions.create({
        ...validSessionData,
        location: "  渋谷  ",
      });

      expect(result.location).toBe("渋谷");
    });

    it("should allow optional notes", async () => {
      const caller = createCaller(mockSession1);

      const withNotes = await caller.sessions.create({
        ...validSessionData,
        notes: "メモあり",
      });
      expect(withNotes.notes).toBe("メモあり");

      const withoutNotes = await caller.sessions.create({
        ...validSessionData,
        notes: undefined,
      });
      expect(withoutNotes.notes).toBeNull();
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.sessions.create(validSessionData)).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getAll procedure", () => {
    it("should return empty array when no sessions", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.sessions.getAll();

      expect(result).toEqual([]);
    });

    it("should return user-scoped sessions only", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      // Create sessions for both users
      await caller1.sessions.create(validSessionData);
      await caller1.sessions.create({
        ...validSessionData,
        location: "アキバポーカー",
      });
      await caller2.sessions.create(validSessionData);

      const user1Sessions = await caller1.sessions.getAll();
      const user2Sessions = await caller2.sessions.getAll();

      expect(user1Sessions).toHaveLength(2);
      expect(user2Sessions).toHaveLength(1);
      expect(user1Sessions.every((s) => s.userId === mockUser1.id)).toBe(true);
      expect(user2Sessions.every((s) => s.userId === mockUser2.id)).toBe(true);
    });

    it("should order by date DESC (most recent first)", async () => {
      const caller = createCaller(mockSession1);

      const session1 = await caller.sessions.create({
        ...validSessionData,
        date: new Date("2025-10-20T10:00:00Z"),
      });
      const session2 = await caller.sessions.create({
        ...validSessionData,
        date: new Date("2025-10-22T10:00:00Z"),
      });
      const session3 = await caller.sessions.create({
        ...validSessionData,
        date: new Date("2025-10-21T10:00:00Z"),
      });

      const sessions = await caller.sessions.getAll();

      expect(sessions[0]?.id).toBe(session2.id); // Most recent
      expect(sessions[1]?.id).toBe(session3.id);
      expect(sessions[2]?.id).toBe(session1.id); // Oldest
    });

    it("should include profit in results", async () => {
      const caller = createCaller(mockSession1);

      await caller.sessions.create(validSessionData);
      const sessions = await caller.sessions.getAll();

      expect(sessions[0]).toHaveProperty("profit");
      expect(sessions[0]?.profit).toBe(5000);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.sessions.getAll()).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getById procedure", () => {
    it("should return session by ID", async () => {
      const caller = createCaller(mockSession1);
      const created = await caller.sessions.create(validSessionData);

      const result = await caller.sessions.getById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.location).toBe(validSessionData.location);
    });

    it("should return null for non-existent ID", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.sessions.getById({ id: 99999 });

      expect(result).toBeNull();
    });

    it("should return null for other user's session (authorization)", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const session = await caller1.sessions.create(validSessionData);
      const result = await caller2.sessions.getById({ id: session.id });

      expect(result).toBeNull(); // User2 cannot access User1's session
    });

    it("should include profit in result", async () => {
      const caller = createCaller(mockSession1);
      const created = await caller.sessions.create(validSessionData);

      const result = await caller.sessions.getById({ id: created.id });

      expect(result).toHaveProperty("profit");
      expect(result?.profit).toBe(5000);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.sessions.getById({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("update procedure", () => {
    it("should update session fields", async () => {
      const caller = createCaller(mockSession1);
      const created = await caller.sessions.create(validSessionData);

      const updated = await caller.sessions.update({
        id: created.id,
        cashOut: 20000,
        notes: "更新されたメモ",
      });

      expect(updated.cashOut).toBe("20000.00");
      expect(updated.notes).toBe("更新されたメモ");
      expect(updated.profit).toBe(10000); // Updated profit
      expect(updated.location).toBe(validSessionData.location); // Unchanged
    });

    it("should update profit when buy-in or cash-out changes", async () => {
      const caller = createCaller(mockSession1);
      const created = await caller.sessions.create(validSessionData);

      const updated = await caller.sessions.update({
        id: created.id,
        buyIn: 15000,
      });

      expect(updated.profit).toBe(0); // cashOut(15000) - buyIn(15000)
    });

    it("should allow partial updates", async () => {
      const caller = createCaller(mockSession1);
      const created = await caller.sessions.create(validSessionData);

      const updated = await caller.sessions.update({
        id: created.id,
        location: "新しい場所",
      });

      expect(updated.location).toBe("新しい場所");
      expect(updated.buyIn).toBe(created.buyIn); // Unchanged
      expect(updated.cashOut).toBe(created.cashOut); // Unchanged
    });

    it("should allow clearing notes", async () => {
      const caller = createCaller(mockSession1);
      const created = await caller.sessions.create({
        ...validSessionData,
        notes: "元のメモ",
      });

      const updated = await caller.sessions.update({
        id: created.id,
        notes: null,
      });

      expect(updated.notes).toBeNull();
    });

    it("should reject updating other user's session", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const session = await caller1.sessions.create(validSessionData);

      await expect(
        caller2.sessions.update({
          id: session.id,
          location: "ハッキング試み",
        })
      ).rejects.toThrow("Session not found");
    });

    it("should reject invalid update data", async () => {
      const caller = createCaller(mockSession1);
      const created = await caller.sessions.create(validSessionData);

      await expect(
        caller.sessions.update({
          id: created.id,
          buyIn: -5000,
        })
      ).rejects.toThrow();
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.sessions.update({ id: 1, location: "test" })).rejects.toThrow(
        "UNAUTHORIZED"
      );
    });
  });

  describe("delete procedure", () => {
    it("should delete session", async () => {
      const caller = createCaller(mockSession1);
      const created = await caller.sessions.create(validSessionData);

      const result = await caller.sessions.delete({ id: created.id });
      expect(result.success).toBe(true);

      const sessions = await caller.sessions.getAll();
      expect(sessions).toHaveLength(0);
    });

    it("should return false for non-existent ID", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.sessions.delete({ id: 99999 });

      expect(result.success).toBe(false);
    });

    it("should prevent deleting other user's session", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const session = await caller1.sessions.create(validSessionData);
      const result = await caller2.sessions.delete({ id: session.id });

      expect(result.success).toBe(false);

      // Verify session still exists
      const check = await caller1.sessions.getById({ id: session.id });
      expect(check).not.toBeNull();
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.sessions.delete({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });
});
