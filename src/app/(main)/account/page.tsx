import { Suspense } from 'react'

import { Container, Text } from '@mantine/core'

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
      <Suspense
        fallback={
          <Container py="xl" size="sm">
            <Text ta="center">Loading...</Text>
          </Container>
        }
      >
        <AccountContent linkedAccounts={linkedAccounts} />
      </Suspense>
    </HydrateClient>
  )
}
