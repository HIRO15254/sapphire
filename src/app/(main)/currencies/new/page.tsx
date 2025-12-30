import { HydrateClient } from '~/trpc/server'

import { NewCurrencyContent } from './NewCurrencyContent'

/**
 * Create new currency page (Server Component).
 *
 * No data fetching needed for creation page.
 */
export default function NewCurrencyPage() {
  return (
    <HydrateClient>
      <NewCurrencyContent />
    </HydrateClient>
  )
}
