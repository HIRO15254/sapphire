import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import { db } from "@/server/db";
import { currencies, games, locations, pokerSessions, users } from "@/server/db/schema";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it } from "vitest";

// Test users
const mockUser1: Session["user"] = {
  id: "test-user-game-1",
  name: "Test User 1",
  email: "game-user1@test.com",
};

const mockUser2: Session["user"] = {
  id: "test-user-game-2",
  name: "Test User 2",
  email: "game-user2@test.com",
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

describe("games router - Contract Tests", () => {
  // Test data holders
  let user1Location1: { id: number; name: string };
  let user1Currency1: { id: number; name: string };
  let user2Location1: { id: number; name: string };
  let user2Currency1: { id: number; name: string };

  beforeEach(async () => {
    // Clean up test data in correct order (respect foreign key constraints)
    await db.delete(pokerSessions);
    await db.delete(games);
    await db.delete(currencies);
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

    // Create locations and currencies for test users
    const caller1 = createCaller(mockSession1);
    const caller2 = createCaller(mockSession2);

    user1Location1 = await caller1.locations.create({ name: "User1 Store" });
    user1Currency1 = await caller1.currencies.create({ name: "User1 Points" });

    user2Location1 = await caller2.locations.create({ name: "User2 Store" });
    user2Currency1 = await caller2.currencies.create({ name: "User2 Points" });
  });

  describe("create procedure", () => {
    it("should create a game with correct structure", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name", "1/2 NL");
      expect(result).toHaveProperty("smallBlind", 1);
      expect(result).toHaveProperty("bigBlind", 2);
      expect(result).toHaveProperty("ante", 0);
      expect(result).toHaveProperty("minBuyIn", 40);
      expect(result).toHaveProperty("maxBuyIn", 200);
      expect(result).toHaveProperty("isArchived", false);
      expect(result).toHaveProperty("location");
      expect(result.location).toEqual({ id: user1Location1.id, name: user1Location1.name });
      expect(result).toHaveProperty("currency");
      expect(result.currency).toEqual({ id: user1Currency1.id, name: user1Currency1.name });
    });

    it("should create a game with ante", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 2,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      expect(result.ante).toBe(2);
    });

    it("should create a game with rules", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
        rules: "No straddle allowed",
      });

      expect(result.rules).toBe("No straddle allowed");
    });

    it("should trim whitespace from name", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "  1/2 NL  ",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      expect(result.name).toBe("1/2 NL");
    });

    it("should reject empty name after trimming", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: user1Currency1.id,
          name: "   ",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow();
    });

    it("should reject name longer than 100 characters", async () => {
      const caller = createCaller(mockSession1);
      const longName = "a".repeat(101);

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: user1Currency1.id,
          name: longName,
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow();
    });

    it("should reject duplicate name in same location (case-insensitive)", async () => {
      const caller = createCaller(mockSession1);

      await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: user1Currency1.id,
          name: "1/2 NL",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow("同じ名前のゲームがこの店舗に既に存在します");

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: user1Currency1.id,
          name: "1/2 nl",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow("同じ名前のゲームがこの店舗に既に存在します");
    });

    it("should allow same name in different locations", async () => {
      const caller = createCaller(mockSession1);
      const location2 = await caller.locations.create({ name: "User1 Store 2" });

      const game1 = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const game2 = await caller.games.create({
        locationId: location2.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      expect(game1.id).not.toBe(game2.id);
    });

    it("should reject BB smaller than SB", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: user1Currency1.id,
          name: "Invalid",
          smallBlind: 2,
          bigBlind: 1,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow("BBはSB以上でなければなりません");
    });

    it("should reject maxBuyIn smaller than minBuyIn", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: user1Currency1.id,
          name: "Invalid",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 200,
          maxBuyIn: 100,
        })
      ).rejects.toThrow("最大バイインは最小バイイン以上でなければなりません");
    });

    it("should reject non-existent location", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.games.create({
          locationId: 99999,
          currencyId: user1Currency1.id,
          name: "1/2 NL",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow("店舗が見つかりません");
    });

    it("should reject non-existent currency", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: 99999,
          name: "1/2 NL",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow("通貨が見つかりません");
    });

    it("should reject other user's location", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.games.create({
          locationId: user2Location1.id,
          currencyId: user1Currency1.id,
          name: "1/2 NL",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow("店舗が見つかりません");
    });

    it("should reject other user's currency", async () => {
      const caller = createCaller(mockSession1);

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: user2Currency1.id,
          name: "1/2 NL",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow("通貨が見つかりません");
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(
        caller.games.create({
          locationId: user1Location1.id,
          currencyId: user1Currency1.id,
          name: "1/2 NL",
          smallBlind: 1,
          bigBlind: 2,
          ante: 0,
          minBuyIn: 40,
          maxBuyIn: 200,
        })
      ).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getAll procedure", () => {
    it("should return empty array when no games", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.games.getAll();

      expect(result).toEqual([]);
    });

    it("should return user-scoped games only", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      await caller1.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await caller2.games.create({
        locationId: user2Location1.id,
        currencyId: user2Currency1.id,
        name: "2/5 NL",
        smallBlind: 2,
        bigBlind: 5,
        ante: 0,
        minBuyIn: 100,
        maxBuyIn: 500,
      });

      const user1Games = await caller1.games.getAll();
      const user2Games = await caller2.games.getAll();

      expect(user1Games).toHaveLength(1);
      expect(user1Games[0]?.name).toBe("1/2 NL");
      expect(user2Games).toHaveLength(1);
      expect(user2Games[0]?.name).toBe("2/5 NL");
    });

    it("should include location and currency info", async () => {
      const caller = createCaller(mockSession1);

      await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const games = await caller.games.getAll();

      expect(games[0]).toHaveProperty("location");
      expect(games[0]?.location.name).toBe("User1 Store");
      expect(games[0]).toHaveProperty("currency");
      expect(games[0]?.currency.name).toBe("User1 Points");
    });

    it("should include session count", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      // Create a session using this game
      await caller.sessions.create({
        date: new Date().toISOString(),
        locationId: user1Location1.id,
        gameId: game.id,
        buyIn: 200,
        cashOut: 400,
        durationMinutes: 120,
      });

      const games = await caller.games.getAll();

      expect(games[0]?._count.sessions).toBe(1);
    });

    it("should filter archived games when includeArchived is false", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await caller.games.archive({ id: game.id });

      const allGames = await caller.games.getAll({ includeArchived: true });
      const activeGames = await caller.games.getAll({ includeArchived: false });

      expect(allGames).toHaveLength(1);
      expect(activeGames).toHaveLength(0);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.getAll()).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getByLocation procedure", () => {
    it("should return games for specific location", async () => {
      const caller = createCaller(mockSession1);
      const location2 = await caller.locations.create({ name: "User1 Store 2" });

      await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await caller.games.create({
        locationId: location2.id,
        currencyId: user1Currency1.id,
        name: "2/5 NL",
        smallBlind: 2,
        bigBlind: 5,
        ante: 0,
        minBuyIn: 100,
        maxBuyIn: 500,
      });

      const loc1Games = await caller.games.getByLocation({ locationId: user1Location1.id });
      const loc2Games = await caller.games.getByLocation({ locationId: location2.id });

      expect(loc1Games).toHaveLength(1);
      expect(loc1Games[0]?.name).toBe("1/2 NL");
      expect(loc2Games).toHaveLength(1);
      expect(loc2Games[0]?.name).toBe("2/5 NL");
    });

    it("should return empty array for other user's location", async () => {
      const caller1 = createCaller(mockSession1);

      const games = await caller1.games.getByLocation({ locationId: user2Location1.id });

      expect(games).toEqual([]);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.getByLocation({ locationId: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getActiveByLocation procedure", () => {
    it("should return only active games", async () => {
      const caller = createCaller(mockSession1);

      const game1 = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "2/5 NL",
        smallBlind: 2,
        bigBlind: 5,
        ante: 0,
        minBuyIn: 100,
        maxBuyIn: 500,
      });

      await caller.games.archive({ id: game1.id });

      const activeGames = await caller.games.getActiveByLocation({
        locationId: user1Location1.id,
      });

      expect(activeGames).toHaveLength(1);
      expect(activeGames[0]?.name).toBe("2/5 NL");
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.getActiveByLocation({ locationId: 1 })).rejects.toThrow(
        "UNAUTHORIZED"
      );
    });
  });

  describe("getById procedure", () => {
    it("should return game with details", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const result = await caller.games.getById({ id: game.id });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(game.id);
      expect(result?.name).toBe("1/2 NL");
      expect(result?.location?.name).toBe("User1 Store");
      expect(result?.currency?.name).toBe("User1 Points");
      expect(result?._count.sessions).toBe(0);
    });

    it("should return null for non-existent game", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.games.getById({ id: 99999 });

      expect(result).toBeNull();
    });

    it("should return null for other user's game", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const game = await caller2.games.create({
        locationId: user2Location1.id,
        currencyId: user2Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const result = await caller1.games.getById({ id: game.id });

      expect(result).toBeNull();
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.getById({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("update procedure", () => {
    it("should update game properties", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const updated = await caller.games.update({
        id: game.id,
        name: "2/5 NL",
        smallBlind: 2,
        bigBlind: 5,
        ante: 5,
        minBuyIn: 100,
        maxBuyIn: 500,
      });

      expect(updated.name).toBe("2/5 NL");
      expect(updated.smallBlind).toBe(2);
      expect(updated.bigBlind).toBe(5);
      expect(updated.ante).toBe(5);
      expect(updated.minBuyIn).toBe(100);
      expect(updated.maxBuyIn).toBe(500);
    });

    it("should update currency", async () => {
      const caller = createCaller(mockSession1);

      const newCurrency = await caller.currencies.create({ name: "New Points" });

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const updated = await caller.games.update({
        id: game.id,
        currencyId: newCurrency.id,
      });

      expect(updated.currency.id).toBe(newCurrency.id);
      expect(updated.currency.name).toBe("New Points");
    });

    it("should reject duplicate name in same location", async () => {
      const caller = createCaller(mockSession1);

      await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const game2 = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "2/5 NL",
        smallBlind: 2,
        bigBlind: 5,
        ante: 0,
        minBuyIn: 100,
        maxBuyIn: 500,
      });

      await expect(caller.games.update({ id: game2.id, name: "1/2 NL" })).rejects.toThrow(
        "同じ名前のゲームがこの店舗に既に存在します"
      );
    });

    it("should allow updating to same name (self update)", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const updated = await caller.games.update({ id: game.id, name: "1/2 NL" });

      expect(updated.name).toBe("1/2 NL");
    });

    it("should throw error for non-existent game", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.games.update({ id: 99999, name: "New Name" })).rejects.toThrow(
        "ゲームが見つかりません"
      );
    });

    it("should prevent updating other user's game", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const game = await caller2.games.create({
        locationId: user2Location1.id,
        currencyId: user2Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await expect(caller1.games.update({ id: game.id, name: "Hacked" })).rejects.toThrow(
        "ゲームが見つかりません"
      );
    });

    it("should reject other user's currency", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await expect(
        caller.games.update({ id: game.id, currencyId: user2Currency1.id })
      ).rejects.toThrow("通貨が見つかりません");
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.update({ id: 1, name: "Test" })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("archive procedure", () => {
    it("should archive a game", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const result = await caller.games.archive({ id: game.id });

      expect(result.success).toBe(true);

      const archived = await caller.games.getById({ id: game.id });
      expect(archived?.isArchived).toBe(true);
    });

    it("should throw error for non-existent game", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.games.archive({ id: 99999 })).rejects.toThrow("ゲームが見つかりません");
    });

    it("should prevent archiving other user's game", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const game = await caller2.games.create({
        locationId: user2Location1.id,
        currencyId: user2Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await expect(caller1.games.archive({ id: game.id })).rejects.toThrow(
        "ゲームが見つかりません"
      );
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.archive({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("unarchive procedure", () => {
    it("should unarchive a game", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await caller.games.archive({ id: game.id });
      const result = await caller.games.unarchive({ id: game.id });

      expect(result.success).toBe(true);

      const unarchived = await caller.games.getById({ id: game.id });
      expect(unarchived?.isArchived).toBe(false);
    });

    it("should throw error for non-existent game", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.games.unarchive({ id: 99999 })).rejects.toThrow("ゲームが見つかりません");
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.unarchive({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("delete procedure", () => {
    it("should delete game when not used by sessions", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const result = await caller.games.delete({ id: game.id });

      expect(result.success).toBe(true);

      const deleted = await caller.games.getById({ id: game.id });
      expect(deleted).toBeNull();
    });

    it("should reject deletion when used by sessions", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await caller.sessions.create({
        date: new Date().toISOString(),
        locationId: user1Location1.id,
        gameId: game.id,
        buyIn: 200,
        cashOut: 400,
        durationMinutes: 120,
      });

      await expect(caller.games.delete({ id: game.id })).rejects.toThrow(
        "このゲームはセッションで使用されているため削除できません"
      );
    });

    it("should throw error for non-existent game", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.games.delete({ id: 99999 })).rejects.toThrow("ゲームが見つかりません");
    });

    it("should prevent deleting other user's game", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const game = await caller2.games.create({
        locationId: user2Location1.id,
        currencyId: user2Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await expect(caller1.games.delete({ id: game.id })).rejects.toThrow("ゲームが見つかりません");
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.delete({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("checkUsage procedure", () => {
    it("should return canDelete: true when game has no sessions", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const result = await caller.games.checkUsage({ id: game.id });

      expect(result.canDelete).toBe(true);
      expect(result.sessionCount).toBe(0);
    });

    it("should return canDelete: false with session count when game is used", async () => {
      const caller = createCaller(mockSession1);

      const game = await caller.games.create({
        locationId: user1Location1.id,
        currencyId: user1Currency1.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await caller.sessions.create({
        date: new Date().toISOString(),
        locationId: user1Location1.id,
        gameId: game.id,
        buyIn: 200,
        cashOut: 400,
        durationMinutes: 120,
      });

      const result = await caller.games.checkUsage({ id: game.id });

      expect(result.canDelete).toBe(false);
      expect(result.sessionCount).toBe(1);
    });

    it("should return canDelete: false for non-existent game", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.games.checkUsage({ id: 99999 });

      expect(result.canDelete).toBe(false);
      expect(result.sessionCount).toBe(0);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.games.checkUsage({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });
});
