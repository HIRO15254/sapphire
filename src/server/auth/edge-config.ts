import type { NextAuthConfig } from 'next-auth'

/**
 * Lightweight auth configuration for Edge Runtime (middleware).
 *
 * This config contains only the settings needed for authentication checks
 * in middleware, without database dependencies.
 */
export const edgeAuthConfig = {
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Refresh every 24 hours
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
      },
    }),
  },
  providers: [], // Providers are only needed for actual auth, not middleware checks
} satisfies NextAuthConfig
