import { api, HydrateClient } from '~/trpc/server'

import { ActiveSessionContent } from './ActiveSessionContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Active session page (Server Component).
 *
 * Shows the current active session or the form to start a new one.
 */
export default async function ActiveSessionPage() {
  // Fetch active session on server
  const activeSession = await api.sessionEvent.getActiveSession()

  // Prefetch stores for the start session form
  void api.store.list.prefetch({})

  return (
    <HydrateClient>
      <ActiveSessionContent initialSession={activeSession} />
    </HydrateClient>
  )
}
