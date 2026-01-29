'use client'

import { Container, Drawer } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { usePageTitle } from '~/contexts/PageTitleContext'
import {
  CurrencyFAB,
  CurrencyList,
  type NewCurrencyFormData,
  NewCurrencyForm,
} from '~/features/currencies'
import type { RouterOutputs } from '~/trpc/react'
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

  // Client-side filtering — all currencies (including archived) are fetched on the server
  const currencies = useMemo(
    () =>
      includeArchived
        ? initialCurrencies
        : initialCurrencies.filter((c) => !c.isArchived),
    [initialCurrencies, includeArchived],
  )

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
