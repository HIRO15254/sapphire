import { auth, signIn } from '~/server/auth'

const ALLOWED_PROVIDERS = ['google', 'discord'] as const

/**
 * GET /api/auth/link/[provider]
 * Initiates OAuth flow to link a new provider to the authenticated user's account.
 * NextAuth's allowDangerousEmailAccountLinking handles the actual account linking.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { provider } = await params

  if (!ALLOWED_PROVIDERS.includes(provider as (typeof ALLOWED_PROVIDERS)[number])) {
    return new Response('Invalid provider', { status: 400 })
  }

  await signIn(provider, { redirectTo: '/account?linked=success' })
}
