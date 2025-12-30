import { notFound } from 'next/navigation'

import { api, HydrateClient } from '~/trpc/server'

import { SessionDetailContent } from './SessionDetailContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

interface SessionDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Session detail page (Server Component).
 *
 * Fetches session data on the server and passes to client component.
 */
export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params

  try {
    const session = await api.session.getById({ id })

    return (
      <HydrateClient>
        <SessionDetailContent initialSession={session} />
      </HydrateClient>
    )
  } catch {
    notFound()
  }
}
