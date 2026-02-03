import { Suspense } from 'react'

import { api, HydrateClient } from '~/trpc/server'

import { AccountContent } from './AccountContent'

export const dynamic = 'force-dynamic'

/**
 * Account settings page (Server Component).
 * Fetches linked accounts data and passes to client component.
 * Wrapped in Suspense to support useSearchParams() in AccountContent.
 */
export default async function AccountPage() {
  const linkedAccounts = await api.account.getLinkedAccounts()

  return (
    <HydrateClient>
      <Suspense fallback={null}>
        <AccountContent linkedAccounts={linkedAccounts} />
      </Suspense>
    </HydrateClient>
  )
}
