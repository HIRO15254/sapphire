import { comparePassword } from "@/lib/utils/password";
import { appRouter } from "@/server/api/root";
import { createInnerTRPCContext } from "@/server/api/trpc";
import { db } from "@/server/db";
import { accounts, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { Session } from "next-auth";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Test users
const TEST_EMAIL = "auth-test@example.com";
const TEST_PASSWORD = "TestPassword123!";
const TEST_NAME = "Auth Test User";

const EXISTING_OAUTH_EMAIL = "oauth-user@example.com";
const EXISTING_OAUTH_USER_ID = "oauth-user-id-123";

// Helper to create tRPC caller (unauthenticated for signup)
function createCaller(session: Session | null = null) {
  const ctx = createInnerTRPCContext({ session });
  return appRouter.createCaller(ctx);
}

describe("auth router - Contract Tests", () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(accounts).where(eq(accounts.userId, EXISTING_OAUTH_USER_ID));
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(users).where(eq(users.email, EXISTING_OAUTH_EMAIL));

    // Create an existing OAuth user (without password)
    await db.insert(users).values({
      id: EXISTING_OAUTH_USER_ID,
      email: EXISTING_OAUTH_EMAIL,
      name: "OAuth User",
      password: null,
    });

    // Add OAuth account for the user
    await db.insert(accounts).values({
      userId: EXISTING_OAUTH_USER_ID,
      type: "oauth",
      provider: "google",
      providerAccountId: "google-123456",
    });
  });

  afterEach(async () => {
    // Clean up after tests
    await db.delete(accounts).where(eq(accounts.userId, EXISTING_OAUTH_USER_ID));
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(users).where(eq(users.email, EXISTING_OAUTH_EMAIL));
  });

  describe("signup procedure", () => {
    it("should create a new user with hashed password", async () => {
      const caller = createCaller();

      const result = await caller.auth.signup({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(TEST_EMAIL);
      expect(result.user.name).toBe(TEST_NAME);
      expect(result.user.id).toBeDefined();

      // Verify password is hashed in database
      const dbUser = await db.query.users.findFirst({
        where: eq(users.email, TEST_EMAIL),
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(TEST_PASSWORD);
      expect(dbUser?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern

      // Verify password comparison works
      const isValid = await comparePassword(TEST_PASSWORD, dbUser!.password!);
      expect(isValid).toBe(true);
    });

    it("should create user without name (optional field)", async () => {
      const caller = createCaller();

      const result = await caller.auth.signup({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(TEST_EMAIL);
      expect(result.user.name).toBeNull();
    });

    it("should reject invalid email format", async () => {
      const caller = createCaller();

      await expect(
        caller.auth.signup({
          email: "invalid-email",
          password: TEST_PASSWORD,
        })
      ).rejects.toThrow();
    });

    it("should reject password shorter than 8 characters", async () => {
      const caller = createCaller();

      await expect(
        caller.auth.signup({
          email: TEST_EMAIL,
          password: "short",
        })
      ).rejects.toThrow();
    });

    it("should reject password longer than 128 characters", async () => {
      const caller = createCaller();
      const longPassword = "a".repeat(129);

      await expect(
        caller.auth.signup({
          email: TEST_EMAIL,
          password: longPassword,
        })
      ).rejects.toThrow();
    });

    it("should reject duplicate email", async () => {
      const caller = createCaller();

      // First signup
      await caller.auth.signup({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      // Duplicate signup
      await expect(
        caller.auth.signup({
          email: TEST_EMAIL,
          password: "DifferentPassword123!",
        })
      ).rejects.toThrow("このメールアドレスは既に登録されています");
    });

    it("should link credentials to existing OAuth user (same email)", async () => {
      const caller = createCaller();

      // Signup with same email as OAuth user
      const result = await caller.auth.signup({
        email: EXISTING_OAUTH_EMAIL,
        password: TEST_PASSWORD,
        name: "Updated Name",
      });

      expect(result.success).toBe(true);
      expect(result.user.id).toBe(EXISTING_OAUTH_USER_ID); // Same user ID

      // Verify password was added to existing user
      const dbUser = await db.query.users.findFirst({
        where: eq(users.email, EXISTING_OAUTH_EMAIL),
      });
      expect(dbUser?.password).toBeDefined();
      expect(dbUser?.password).not.toBeNull();

      // Original name should be preserved (not overwritten)
      expect(dbUser?.name).toBe("OAuth User");
    });

    it("should handle email case-insensitively", async () => {
      const caller = createCaller();

      await caller.auth.signup({
        email: TEST_EMAIL.toLowerCase(),
        password: TEST_PASSWORD,
      });

      // Try to signup with different case
      await expect(
        caller.auth.signup({
          email: TEST_EMAIL.toUpperCase(),
          password: TEST_PASSWORD,
        })
      ).rejects.toThrow("このメールアドレスは既に登録されています");
    });
  });

  describe("credentials signin (via NextAuth)", () => {
    beforeEach(async () => {
      // Create a credentials user for signin tests
      const caller = createCaller();
      await caller.auth.signup({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      });
    });

    it("should have correct password stored for signin verification", async () => {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.email, TEST_EMAIL),
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.password).toBeDefined();

      // Password should verify correctly
      const isValid = await comparePassword(TEST_PASSWORD, dbUser!.password!);
      expect(isValid).toBe(true);

      // Wrong password should fail
      const isInvalid = await comparePassword("WrongPassword", dbUser!.password!);
      expect(isInvalid).toBe(false);
    });

    it("should store email exactly as provided", async () => {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.email, TEST_EMAIL),
      });

      expect(dbUser?.email).toBe(TEST_EMAIL);
    });
  });
});
