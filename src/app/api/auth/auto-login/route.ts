import { NextResponse } from 'next/server'

import { signIn } from '~/server/auth'

/**
 * Auto-login API route for Vercel preview deployments.
 *
 * Automatically signs in with credentials from environment variables
 * so PR reviewers don't need to manually enter login details.
 * Only works when VERCEL_ENV is "preview".
 */
export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json(
      { error: 'Auto-login is only available in preview environments' },
      { status: 403 },
    )
  }

  const email = process.env.PREVIEW_AUTO_LOGIN_EMAIL
  const password = process.env.PREVIEW_AUTO_LOGIN_PASSWORD

  if (!email || !password) {
    const baseUrl = `https://${process.env.VERCEL_URL}`
    return NextResponse.redirect(new URL('/auth/signin', baseUrl))
  }

  // NextAuth v5 server-side signIn handles redirect internally
  await signIn('credentials', {
    email,
    password,
    redirectTo: '/dashboard',
  })
}
