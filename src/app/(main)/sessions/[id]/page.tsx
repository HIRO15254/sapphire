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
 * Fetches session and stores data on the server and passes to client component.
 */
export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params

  try {
    const [session, { stores }] = await Promise.all([
      api.session.getById({ id }),
      api.store.list({ includeArchived: false }),
    ])

    return (
      <HydrateClient>
        <SessionDetailContent session={session} stores={stores} />
      </HydrateClient>
    )
  } catch {
    notFound()
  }
}
