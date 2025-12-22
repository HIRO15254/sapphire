import { api, HydrateClient } from '~/trpc/server'

import { CurrenciesContent } from './CurrenciesContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Currency list page (Server Component).
 *
 * Fetches initial currency data on the server and passes to client component.
 */
export default async function CurrenciesPage() {
  // Fetch initial data (non-archived currencies) on server
  const initialData = await api.currency.list({
    includeArchived: false,
  })

  return (
    <HydrateClient>
      <CurrenciesContent initialCurrencies={initialData.currencies} />
    </HydrateClient>
  )
}
