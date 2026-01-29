'use client'

import {
  Alert,
  Container,
  Drawer,
  Loader,
  Stack,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { usePageTitle } from '~/contexts/PageTitleContext'
import {
  CurrencyFAB,
  CurrencyList,
  type NewCurrencyFormData,
  NewCurrencyForm,
} from '~/features/currencies'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import { createCurrency } from './actions/index'

type CurrencyData = RouterOutputs['currency']['list']['currencies'][number]

interface CurrenciesContentProps {
  initialCurrencies: CurrencyData[]
}

export function CurrenciesContent({
  initialCurrencies,
}: CurrenciesContentProps) {
  usePageTitle('Currencies')

  const router = useRouter()
  const [includeArchived, setIncludeArchived] = useState(false)
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false)
  const [isCreating, startCreateTransition] = useTransition()

  // Fetch archived data only when includeArchived is true
  const { data, isLoading, error } = api.currency.list.useQuery(
    { includeArchived: true },
    {
      enabled: includeArchived,
    },
  )

  // Use server data by default, switch to query data when includeArchived is true
  const currencies = includeArchived
    ? (data?.currencies ?? [])
    : initialCurrencies

  const handleCreateCurrency = (formData: NewCurrencyFormData) => {
    startCreateTransition(async () => {
      const result = await createCurrency(formData)

      if (result.success) {
        notifications.show({
          title: 'Currency Created',
          message: 'Your currency has been saved',
          color: 'green',
        })
        closeDrawer()
        router.push(`/currencies/${result.data.id}`)
      } else {
        notifications.show({
          title: 'Error',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  if (includeArchived && isLoading) {
    return (
      <Container py="xl" size="md">
        <Stack align="center" gap="lg">
          <Loader size="lg" />
          <Text c="dimmed">Loading...</Text>
        </Stack>
      </Container>
    )
  }

  if (includeArchived && error) {
    return (
      <Container py="xl" size="md">
        <Alert color="red" icon={<IconAlertCircle size={16} />} title="Error">
          {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container py="xl" size="md">
      <CurrencyList
        currencies={currencies}
        includeArchived={includeArchived}
        onIncludeArchivedChange={setIncludeArchived}
        onOpenNewCurrency={openDrawer}
      />

      <CurrencyFAB onOpen={openDrawer} />

      <Drawer
        onClose={closeDrawer}
        opened={drawerOpened}
        position="bottom"
        size="auto"
        title="Add Currency"
      >
        <NewCurrencyForm
          isSubmitting={isCreating}
          onCancel={closeDrawer}
          onSubmit={handleCreateCurrency}
        />
      </Drawer>
    </Container>
  )
}
