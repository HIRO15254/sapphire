import { api, HydrateClient } from '~/trpc/server'

import { AccountContent } from './AccountContent'

export const dynamic = 'force-dynamic'

/**
 * Account settings page (Server Component).
 * Fetches linked accounts data and passes to client component.
 */
export default async function AccountPage() {
  const linkedAccounts = await api.account.getLinkedAccounts()

  return (
    <HydrateClient>
      <AccountContent linkedAccounts={linkedAccounts} />
    </HydrateClient>
  )
}
