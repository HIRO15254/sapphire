import { TRPCError } from '@trpc/server'
import { notFound } from 'next/navigation'

import { api, HydrateClient } from '~/trpc/server'

import { StoreDetailContent } from './StoreDetailContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

interface StoreDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Store detail page (Server Component).
 *
 * Fetches store data on the server and passes to client component.
 */
export default async function StoreDetailPage({
  params,
}: StoreDetailPageProps) {
  const { id } = await params

  try {
    // Fetch data on server
    const store = await api.store.getById({ id })

    if (!store) {
      notFound()
    }

    // Fetch currencies for forms
    const currenciesData = await api.currency.list({ includeArchived: false })

    return (
      <HydrateClient>
        <StoreDetailContent
          currencies={currenciesData.currencies}
          initialStore={store}
        />
      </HydrateClient>
    )
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
      notFound()
    }
    throw error
  }
}
