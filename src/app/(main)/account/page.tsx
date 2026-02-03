import { api, HydrateClient } from '~/trpc/server'

import { AccountContent } from './AccountContent'

export const dynamic = 'force-dynamic'

interface AccountPageProps {
  searchParams: Promise<{ linked?: string; error?: string }>
}

/**
 * Account settings page (Server Component).
 * Reads search params server-side and passes to client component as props,
 * avoiding the need for useSearchParams() + Suspense on the client.
 */
export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [linkedAccounts, params] = await Promise.all([
    api.account.getLinkedAccounts(),
    searchParams,
  ])

  return (
    <HydrateClient>
      <AccountContent
        linkedAccounts={linkedAccounts}
        linkResult={params.linked ?? null}
        linkError={params.error ?? null}
      />
    </HydrateClient>
  )
}
