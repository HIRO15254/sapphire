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
  // Fetch all data on server (client-side filtering)
  const [sessionsData, storesData, currenciesData] = await Promise.all([
    api.session.list({}), // No limit - fetch all sessions
    api.store.list({ includeArchived: false }),
    api.currency.list({ includeArchived: false }),
  ])

  return (
    <HydrateClient>
      <SessionsContent
        currencies={currenciesData.currencies}
        sessions={sessionsData.sessions}
        stores={storesData.stores}
      />
    </HydrateClient>
  )
}
