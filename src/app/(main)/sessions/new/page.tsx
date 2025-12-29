import { api, HydrateClient } from '~/trpc/server'

import { NewSessionContent } from './NewSessionContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * New session page (Server Component).
 *
 * Fetches stores for the form.
 */
export default async function NewSessionPage() {
  // Prefetch data for the form
  const storesData = await api.store.list()

  return (
    <HydrateClient>
      <NewSessionContent stores={storesData.stores} />
    </HydrateClient>
  )
}
