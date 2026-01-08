import { api, HydrateClient } from '~/trpc/server'

import { PlayersContent } from './PlayersContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Player list page (Server Component).
 *
 * Fetches initial player and tag data on the server and passes to client component.
 */
export default async function PlayersPage() {
  // Fetch initial data on server
  const [playersData, tagsData] = await Promise.all([
    api.player.list({}),
    api.playerTag.list(),
  ])

  return (
    <HydrateClient>
      <PlayersContent
        initialPlayers={playersData.players}
        initialTags={tagsData.tags}
      />
    </HydrateClient>
  )
}
