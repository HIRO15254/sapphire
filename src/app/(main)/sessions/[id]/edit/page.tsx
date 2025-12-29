import { notFound } from 'next/navigation'

import { api, HydrateClient } from '~/trpc/server'

import { EditSessionContent } from './EditSessionContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

interface EditSessionPageProps {
  params: Promise<{ id: string }>
}

/**
 * Session edit page (Server Component).
 *
 * Fetches session and stores data on the server and passes to client component.
 */
export default async function EditSessionPage({
  params,
}: EditSessionPageProps) {
  const { id } = await params

  try {
    const [session, { stores }] = await Promise.all([
      api.session.getById({ id }),
      api.store.list({ includeArchived: false }),
    ])

    return (
      <HydrateClient>
        <EditSessionContent initialSession={session} stores={stores} />
      </HydrateClient>
    )
  } catch {
    notFound()
  }
}
