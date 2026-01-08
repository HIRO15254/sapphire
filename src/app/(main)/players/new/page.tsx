import { HydrateClient } from '~/trpc/server'

import { NewPlayerContent } from './NewPlayerContent'

/**
 * Create new player page (Server Component).
 *
 * No data fetching needed for creation page.
 */
export default function NewPlayerPage() {
  return (
    <HydrateClient>
      <NewPlayerContent />
    </HydrateClient>
  )
}
