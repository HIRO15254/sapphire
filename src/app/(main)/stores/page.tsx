import { api, HydrateClient } from '~/trpc/server'

import { StoresContent } from './StoresContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Store list page (Server Component).
 *
 * Fetches initial store data on the server and passes to client component.
 */
export default async function StoresPage() {
  // Fetch initial data (non-archived stores) on server
  const initialData = await api.store.list({
    includeArchived: false,
  })

  return (
    <HydrateClient>
      <StoresContent initialStores={initialData.stores} />
    </HydrateClient>
  )
}
