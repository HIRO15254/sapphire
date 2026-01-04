import { TRPCError } from '@trpc/server'
import { notFound } from 'next/navigation'

import { api, HydrateClient } from '~/trpc/server'

import { PlayerDetailContent } from './PlayerDetailContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

interface PlayerDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Player detail page (Server Component).
 *
 * Fetches player data on the server and passes to client component.
 */
export default async function PlayerDetailPage({
  params,
}: PlayerDetailPageProps) {
  const { id } = await params

  try {
    // Fetch data on server
    const player = await api.player.getById({ id })
    const tagsData = await api.playerTag.list()

    if (!player) {
      notFound()
    }

    return (
      <HydrateClient>
        <PlayerDetailContent
          initialPlayer={player}
          allTags={tagsData.tags}
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
