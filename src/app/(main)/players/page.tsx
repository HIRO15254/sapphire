import { api, HydrateClient } from '~/trpc/server'

import { PlayersContent } from './PlayersContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Player list page (Server Component).
 *
 * Fetches all player and tag data on the server and passes to client component.
 */
export default async function PlayersPage() {
  // Fetch all data on server (client-side filtering)
  const [playersData, tagsData] = await Promise.all([
    api.player.list({}),
    api.playerTag.list(),
  ])

  return (
    <HydrateClient>
      <PlayersContent
        players={playersData.players}
        tags={tagsData.tags}
      />
    </HydrateClient>
  )
}
