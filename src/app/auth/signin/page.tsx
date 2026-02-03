import { redirect } from 'next/navigation'

import SignInContent from './SignInContent'

/**
 * Sign-in page with auto-login support for Vercel preview deployments.
 *
 * In preview environments with PREVIEW_AUTO_LOGIN_EMAIL and
 * PREVIEW_AUTO_LOGIN_PASSWORD set, users are automatically redirected
 * to the auto-login API route. Otherwise, the standard sign-in form
 * is displayed.
 *
 * If auto-login previously failed (e.g. account doesn't exist),
 * the `auto-login-failed` query param prevents re-triggering
 * the redirect, avoiding an infinite loop.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const autoLoginFailed = params['auto-login-failed']

  const isPreview = process.env.VERCEL_ENV === 'preview'
  const hasAutoLoginCredentials =
    process.env.PREVIEW_AUTO_LOGIN_EMAIL &&
    process.env.PREVIEW_AUTO_LOGIN_PASSWORD

  if (isPreview && hasAutoLoginCredentials && !autoLoginFailed) {
    redirect('/api/auth/auto-login')
  }

  return <SignInContent />
}
