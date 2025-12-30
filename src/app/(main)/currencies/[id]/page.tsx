import { TRPCError } from '@trpc/server'
import { notFound } from 'next/navigation'

import { api, HydrateClient } from '~/trpc/server'

import { CurrencyDetailContent } from './CurrencyDetailContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

interface CurrencyDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Currency detail page (Server Component).
 *
 * Fetches currency data on the server and passes to client component.
 */
export default async function CurrencyDetailPage({
  params,
}: CurrencyDetailPageProps) {
  const { id } = await params

  try {
    // Fetch data on server
    const currency = await api.currency.getById({ id })

    if (!currency) {
      notFound()
    }

    return (
      <HydrateClient>
        <CurrencyDetailContent initialCurrency={currency} />
      </HydrateClient>
    )
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
      notFound()
    }
    throw error
  }
}
