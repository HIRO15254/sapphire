import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { hashPassword } from '~/server/auth'
import { users } from '~/server/db/schema'
import { createTRPCRouter, publicProcedure } from '../trpc'

/**
 * Authentication router for user registration.
 * Login is handled by NextAuth Credentials provider.
 */
export const authRouter = createTRPCRouter({
  /**
   * Register a new user with email and password.
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email('有効なメールアドレスを入力してください'),
        password: z
          .string()
          .min(8, 'パスワードは8文字以上で入力してください')
          .max(100, 'パスワードは100文字以下で入力してください'),
        name: z.string().min(1, '名前を入力してください').optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'このメールアドレスは既に登録されています',
        })
      }

      // Hash password
      const passwordHash = await hashPassword(input.password)

      // Create user
      const [newUser] = await ctx.db
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          name: input.name,
        })
        .returning({ id: users.id, email: users.email, name: users.name })

      return {
        success: true,
        user: newUser,
      }
    }),
})
