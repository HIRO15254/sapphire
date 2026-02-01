'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { auth, hashPassword, verifyPassword } from '~/server/auth'
import { db } from '~/server/db'
import { accounts, users } from '~/server/db/schema'

type ActionResult = { success: true } | { success: false; error: string }

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

/**
 * Unlink an OAuth provider from the current user's account.
 * Prevents unlinking if it would leave the user with no login methods.
 */
export async function unlinkProvider(provider: string): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId()

    // Get current linked accounts and password status
    const [linkedAccounts, user] = await Promise.all([
      db
        .select({ provider: accounts.provider })
        .from(accounts)
        .where(eq(accounts.userId, userId)),
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { passwordHash: true },
      }),
    ])

    const hasPassword = !!user?.passwordHash
    const oauthCount = linkedAccounts.length
    const totalMethods = oauthCount + (hasPassword ? 1 : 0)

    // Check if this is the target provider
    const hasProvider = linkedAccounts.some((a) => a.provider === provider)
    if (!hasProvider) {
      return { success: false, error: 'Provider is not linked to your account' }
    }

    // Prevent removing the last login method
    if (totalMethods <= 1) {
      return {
        success: false,
        error: 'At least one login method is required',
      }
    }

    // Delete the provider link
    await db
      .delete(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.provider, provider)),
      )

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    return { success: false, error: 'Failed to unlink provider' }
  }
}

const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

/**
 * Set a password for the current user (for users who only have OAuth).
 */
export async function setPassword(data: {
  password: string
  confirmPassword: string
}): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId()

    const parsed = setPasswordSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? 'Invalid input',
      }
    }

    // Check if password is already set
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: true },
    })

    if (user?.passwordHash) {
      return {
        success: false,
        error: 'Password is already set. Use change password instead.',
      }
    }

    const hash = await hashPassword(parsed.data.password)

    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId))

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    return { success: false, error: 'Failed to set password' }
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

/**
 * Change the current user's password.
 * Requires the current password for verification.
 */
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId()

    const parsed = changePasswordSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? 'Invalid input',
      }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return {
        success: false,
        error: 'No password set. Use set password instead.',
      }
    }

    const isValid = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash,
    )

    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    const hash = await hashPassword(parsed.data.newPassword)

    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId))

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    return { success: false, error: 'Failed to change password' }
  }
}
