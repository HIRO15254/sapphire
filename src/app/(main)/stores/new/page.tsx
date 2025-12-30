import { HydrateClient } from '~/trpc/server'

import { NewStoreContent } from './NewStoreContent'

/**
 * Create new store page (Server Component).
 *
 * No data fetching needed for creation page.
 */
export default function NewStorePage() {
  return (
    <HydrateClient>
      <NewStoreContent />
    </HydrateClient>
  )
}
