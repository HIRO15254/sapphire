import { api, HydrateClient } from '~/trpc/server'

import { SessionsContent } from './SessionsContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Session list page (Server Component).
 *
 * Fetches initial session data on the server and passes to client component.
 */
export default async function SessionsPage() {
  // Fetch initial data on server
  const [initialData, storesData, currenciesData] = await Promise.all([
    api.session.list({
      limit: 20,
      offset: 0,
    }),
    api.store.list({ includeArchived: false }),
    api.currency.list({ includeArchived: false }),
  ])

  return (
    <HydrateClient>
      <SessionsContent
        currencies={currenciesData.currencies}
        initialSessions={initialData.sessions}
        initialTotal={initialData.total}
        stores={storesData.stores}
      />
    </HydrateClient>
  )
}
