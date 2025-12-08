import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import { db } from "@/server/db";
import { currencies, games, locations, pokerSessions, users } from "@/server/db/schema";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it } from "vitest";

// Test users
const mockUser1: Session["user"] = {
  id: "test-user-currency-1",
  name: "Test User 1",
  email: "currency-user1@test.com",
};

const mockUser2: Session["user"] = {
  id: "test-user-currency-2",
  name: "Test User 2",
  email: "currency-user2@test.com",
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

describe("currencies router - Contract Tests", () => {
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
  });

  describe("create procedure", () => {
    it("should create a currency with correct structure", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.currencies.create({ name: "GGポイント" });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name", "GGポイント");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });

    it("should trim whitespace from name", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.currencies.create({ name: "  GGポイント  " });

      expect(result.name).toBe("GGポイント");
    });

    it("should reject empty name after trimming", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.currencies.create({ name: "   " })).rejects.toThrow();
    });

    it("should reject name longer than 100 characters", async () => {
      const caller = createCaller(mockSession1);

      const longName = "a".repeat(101);
      await expect(caller.currencies.create({ name: longName })).rejects.toThrow();
    });

    it("should reject duplicate name (case-insensitive)", async () => {
      const caller = createCaller(mockSession1);

      await caller.currencies.create({ name: "GGポイント" });

      await expect(caller.currencies.create({ name: "GGポイント" })).rejects.toThrow(
        "同じ名前の通貨が既に存在します"
      );
      await expect(caller.currencies.create({ name: "ggポイント" })).rejects.toThrow(
        "同じ名前の通貨が既に存在します"
      );
    });

    it("should allow same name for different users", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const currency1 = await caller1.currencies.create({ name: "共通通貨" });
      const currency2 = await caller2.currencies.create({ name: "共通通貨" });

      expect(currency1.id).not.toBe(currency2.id);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.currencies.create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getAll procedure", () => {
    it("should return empty array when no currencies", async () => {
      const caller = createCaller(mockSession1);
      const result = await caller.currencies.getAll();

      expect(result).toEqual([]);
    });

    it("should return user-scoped currencies only", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      // Create currencies for both users
      await caller1.currencies.create({ name: "GGポイント" });
      await caller1.currencies.create({ name: "JOPTポイント" });
      await caller2.currencies.create({ name: "PPポイント" });

      const user1Currencies = await caller1.currencies.getAll();
      const user2Currencies = await caller2.currencies.getAll();

      expect(user1Currencies).toHaveLength(2);
      expect(user2Currencies).toHaveLength(1);
    });

    it("should order by name ASC", async () => {
      const caller = createCaller(mockSession1);

      await caller.currencies.create({ name: "Zebra" });
      await caller.currencies.create({ name: "Apple" });
      await caller.currencies.create({ name: "Mango" });

      const allCurrencies = await caller.currencies.getAll();

      expect(allCurrencies[0]?.name).toBe("Apple");
      expect(allCurrencies[1]?.name).toBe("Mango");
      expect(allCurrencies[2]?.name).toBe("Zebra");
    });

    it("should include _count.games in results", async () => {
      const caller = createCaller(mockSession1);

      // Create a currency
      const currency = await caller.currencies.create({ name: "テスト通貨" });

      // Create a location and game using this currency
      const location = await caller.locations.create({ name: "テスト店舗" });
      await caller.games.create({
        locationId: location.id,
        currencyId: currency.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const allCurrencies = await caller.currencies.getAll();

      expect(allCurrencies[0]).toHaveProperty("_count");
      expect(allCurrencies[0]?._count.games).toBe(1);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.currencies.getAll()).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getById procedure", () => {
    it("should return currency with associated games", async () => {
      const caller = createCaller(mockSession1);

      const currency = await caller.currencies.create({ name: "テスト通貨" });
      const location = await caller.locations.create({ name: "テスト店舗" });
      await caller.games.create({
        locationId: location.id,
        currencyId: currency.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const result = await caller.currencies.getById({ id: currency.id });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(currency.id);
      expect(result?.games).toHaveLength(1);
      expect(result?.games[0]).toHaveProperty("name", "1/2 NL");
      expect(result?.games[0]).toHaveProperty("locationName", "テスト店舗");
    });

    it("should return null for non-existent currency", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.currencies.getById({ id: 99999 });

      expect(result).toBeNull();
    });

    it("should return null for other user's currency", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const currency = await caller1.currencies.create({ name: "User1の通貨" });

      const result = await caller2.currencies.getById({ id: currency.id });

      expect(result).toBeNull();
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.currencies.getById({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("update procedure", () => {
    it("should update currency name", async () => {
      const caller = createCaller(mockSession1);

      const currency = await caller.currencies.create({ name: "旧名称" });
      const updated = await caller.currencies.update({ id: currency.id, name: "新名称" });

      expect(updated.name).toBe("新名称");
      expect(updated.id).toBe(currency.id);
    });

    it("should trim whitespace from new name", async () => {
      const caller = createCaller(mockSession1);

      const currency = await caller.currencies.create({ name: "旧名称" });
      const updated = await caller.currencies.update({ id: currency.id, name: "  新名称  " });

      expect(updated.name).toBe("新名称");
    });

    it("should reject duplicate name (case-insensitive)", async () => {
      const caller = createCaller(mockSession1);

      await caller.currencies.create({ name: "既存通貨" });
      const currency = await caller.currencies.create({ name: "変更対象" });

      await expect(caller.currencies.update({ id: currency.id, name: "既存通貨" })).rejects.toThrow(
        "同じ名前の通貨が既に存在します"
      );
    });

    it("should allow updating to same name (self update)", async () => {
      const caller = createCaller(mockSession1);

      const currency = await caller.currencies.create({ name: "同じ名前" });
      const updated = await caller.currencies.update({ id: currency.id, name: "同じ名前" });

      expect(updated.name).toBe("同じ名前");
    });

    it("should throw error for non-existent currency", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.currencies.update({ id: 99999, name: "新名称" })).rejects.toThrow(
        "通貨が見つかりません"
      );
    });

    it("should prevent updating other user's currency", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const currency = await caller1.currencies.create({ name: "User1の通貨" });

      await expect(
        caller2.currencies.update({ id: currency.id, name: "不正な更新" })
      ).rejects.toThrow("通貨が見つかりません");
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.currencies.update({ id: 1, name: "Test" })).rejects.toThrow(
        "UNAUTHORIZED"
      );
    });
  });

  describe("delete procedure", () => {
    it("should delete currency when not used by games", async () => {
      const caller = createCaller(mockSession1);

      const currency = await caller.currencies.create({ name: "削除対象" });
      const result = await caller.currencies.delete({ id: currency.id });

      expect(result.success).toBe(true);

      // Verify currency was deleted
      const allCurrencies = await caller.currencies.getAll();
      expect(allCurrencies.find((c) => c.id === currency.id)).toBeUndefined();
    });

    it("should reject deletion when used by games", async () => {
      const caller = createCaller(mockSession1);

      const currency = await caller.currencies.create({ name: "使用中通貨" });
      const location = await caller.locations.create({ name: "テスト店舗" });

      await caller.games.create({
        locationId: location.id,
        currencyId: currency.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      await expect(caller.currencies.delete({ id: currency.id })).rejects.toThrow(
        "この通貨はゲームで使用されているため削除できません"
      );
    });

    it("should throw error for non-existent currency", async () => {
      const caller = createCaller(mockSession1);

      await expect(caller.currencies.delete({ id: 99999 })).rejects.toThrow("通貨が見つかりません");
    });

    it("should prevent deleting other user's currency", async () => {
      const caller1 = createCaller(mockSession1);
      const caller2 = createCaller(mockSession2);

      const currency = await caller1.currencies.create({ name: "User1の通貨" });

      await expect(caller2.currencies.delete({ id: currency.id })).rejects.toThrow(
        "通貨が見つかりません"
      );
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.currencies.delete({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("checkUsage procedure", () => {
    it("should return canDelete: true when currency has no games", async () => {
      const caller = createCaller(mockSession1);

      const currency = await caller.currencies.create({ name: "未使用通貨" });
      const result = await caller.currencies.checkUsage({ id: currency.id });

      expect(result.canDelete).toBe(true);
      expect(result.usedByGames).toHaveLength(0);
    });

    it("should return canDelete: false with game details when currency is used", async () => {
      const caller = createCaller(mockSession1);

      const currency = await caller.currencies.create({ name: "使用中通貨" });
      const location = await caller.locations.create({ name: "テスト店舗" });

      await caller.games.create({
        locationId: location.id,
        currencyId: currency.id,
        name: "1/2 NL",
        smallBlind: 1,
        bigBlind: 2,
        ante: 0,
        minBuyIn: 40,
        maxBuyIn: 200,
      });

      const result = await caller.currencies.checkUsage({ id: currency.id });

      expect(result.canDelete).toBe(false);
      expect(result.usedByGames).toHaveLength(1);
      expect(result.usedByGames[0]).toHaveProperty("name", "1/2 NL");
      expect(result.usedByGames[0]).toHaveProperty("locationName", "テスト店舗");
    });

    it("should return canDelete: false for non-existent currency", async () => {
      const caller = createCaller(mockSession1);

      const result = await caller.currencies.checkUsage({ id: 99999 });

      expect(result.canDelete).toBe(false);
      expect(result.usedByGames).toHaveLength(0);
    });

    it("should require authentication", async () => {
      const caller = createCaller(null);

      await expect(caller.currencies.checkUsage({ id: 1 })).rejects.toThrow("UNAUTHORIZED");
    });
  });
});
