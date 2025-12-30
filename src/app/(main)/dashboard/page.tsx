import { api, HydrateClient } from '~/trpc/server'

import { DashboardContent } from './DashboardContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Dashboard page (Server Component).
 *
 * Fetches currency data on the server and passes calculated values to client component.
 */
export default async function DashboardPage() {
  // Fetch data on server
  const { currencies } = await api.currency.list({
    includeArchived: false,
  })

  // Calculate total balance on server
  const totalBalance = currencies.reduce((sum, c) => sum + c.currentBalance, 0)

  return (
    <HydrateClient>
      <DashboardContent totalBalance={totalBalance} />
    </HydrateClient>
  )
}
