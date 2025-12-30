'use client'

import {
  Button,
  Container,
  Group,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  addCurrencyBonus,
  addCurrencyPurchase,
  archiveCurrency,
  deleteCurrency,
  unarchiveCurrency,
  updateCurrency,
} from '../actions/index'
import { BalanceBreakdown } from './BalanceBreakdown'
import { CurrencyHeader } from './CurrencyHeader'
import { TransactionHistorySection } from './TransactionHistorySection'
import {
  addBonusFormSchema,
  addPurchaseFormSchema,
  type Currency,
  updateCurrencyFormSchema,
} from './types'

interface CurrencyDetailContentProps {
  initialCurrency: Currency
}

/**
 * Currency detail content client component.
 *
 * Shows currency details with balance breakdown and transaction history.
 * Provides actions to edit, archive, delete, and add transactions.
 * Uses initial data from server, refetches on mutations.
 */
export function CurrencyDetailContent({
  initialCurrency,
}: CurrencyDetailContentProps) {
  const router = useRouter()
  const currencyId = initialCurrency.id

  const [editMode, setEditMode] = useState(false)
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false)
  const [bonusModalOpened, { open: openBonusModal, close: closeBonusModal }] =
    useDisclosure(false)
  const [
    purchaseModalOpened,
    { open: openPurchaseModal, close: closePurchaseModal },
  ] = useDisclosure(false)

  // Transition states for Server Actions
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isArchiving, startArchiveTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isAddingBonus, startAddBonusTransition] = useTransition()
  const [isAddingPurchase, startAddPurchaseTransition] = useTransition()

  // Use data from Server Component props (refreshed via router.refresh())
  const currency = initialCurrency

  // Forms
  const editForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: currency?.name ?? '',
      initialBalance: currency?.initialBalance ?? 0,
    },
    validate: zodResolver(updateCurrencyFormSchema),
  })

  const bonusForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      amount: 0,
      source: '',
    },
    validate: zodResolver(addBonusFormSchema),
  })

  const purchaseForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      amount: 0,
      note: '',
    },
    validate: zodResolver(addPurchaseFormSchema),
  })

  // Event handlers
  const handleEditSubmit = editForm.onSubmit((values) => {
    startUpdateTransition(async () => {
      const result = await updateCurrency({
        id: currencyId,
        ...values,
      })

      if (result.success) {
        notifications.show({
          title: '更新完了',
          message: '通貨を更新しました',
          color: 'green',
        })
        setEditMode(false)
        router.refresh()
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  })

  const handleBonusSubmit = bonusForm.onSubmit((values) => {
    startAddBonusTransition(async () => {
      const result = await addCurrencyBonus({
        currencyId,
        amount: values.amount,
        source: values.source || undefined,
      })

      if (result.success) {
        notifications.show({
          title: '追加完了',
          message: 'ボーナスを追加しました',
          color: 'green',
        })
        closeBonusModal()
        bonusForm.reset()
        router.refresh()
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  })

  const handlePurchaseSubmit = purchaseForm.onSubmit((values) => {
    startAddPurchaseTransition(async () => {
      const result = await addCurrencyPurchase({
        currencyId,
        amount: values.amount,
        note: values.note || undefined,
      })

      if (result.success) {
        notifications.show({
          title: '追加完了',
          message: '購入を追加しました',
          color: 'green',
        })
        closePurchaseModal()
        purchaseForm.reset()
        router.refresh()
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  })

  const handleArchiveToggle = () => {
    startArchiveTransition(async () => {
      const result = currency?.isArchived
        ? await unarchiveCurrency({ id: currencyId })
        : await archiveCurrency({ id: currencyId })

      if (result.success) {
        notifications.show({
          title: currency?.isArchived ? 'アーカイブ解除完了' : 'アーカイブ完了',
          message: currency?.isArchived
            ? '通貨のアーカイブを解除しました'
            : '通貨をアーカイブしました',
          color: 'green',
        })
        router.refresh()
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  const handleDelete = () => {
    closeDeleteModal()
    startDeleteTransition(async () => {
      const result = await deleteCurrency({ id: currencyId })

      if (result.success) {
        notifications.show({
          title: '削除完了',
          message: '通貨を削除しました',
          color: 'green',
        })
        router.push('/currencies')
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  // Update form when currency data changes
  if (editForm.values.name !== currency.name) {
    editForm.setValues({
      name: currency.name,
      initialBalance: currency.initialBalance,
    })
  }

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Button
          component={Link}
          href="/currencies"
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          w="fit-content"
        >
          通貨一覧に戻る
        </Button>

        {/* Header */}
        <CurrencyHeader
          isArchived={currency.isArchived}
          isArchiving={isArchiving}
          name={currency.name}
          onArchiveClick={handleArchiveToggle}
          onDeleteClick={openDeleteModal}
          onEditClick={() => setEditMode(!editMode)}
        />

        {/* Edit Form */}
        {editMode && (
          <Paper p="lg" radius="md" shadow="sm" withBorder>
            <form onSubmit={handleEditSubmit}>
              <Stack>
                <TextInput
                  label="通貨名"
                  withAsterisk
                  {...editForm.getInputProps('name')}
                />
                <NumberInput
                  label="初期残高"
                  min={0}
                  thousandSeparator=","
                  {...editForm.getInputProps('initialBalance')}
                />
                <Group justify="flex-end">
                  <Button onClick={() => setEditMode(false)} variant="subtle">
                    キャンセル
                  </Button>
                  <Button loading={isUpdating} type="submit">
                    保存
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}

        {/* Balance Breakdown */}
        <BalanceBreakdown currency={currency} />

        {/* Transaction History Section */}
        <TransactionHistorySection
          currency={currency}
          onAddBonusClick={openBonusModal}
          onAddPurchaseClick={openPurchaseModal}
        />
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        centered
        onClose={closeDeleteModal}
        opened={deleteModalOpened}
        title="通貨の削除"
      >
        <Stack>
          <Text>
            「{currency.name}」を削除しますか？この操作は取り消せません。
          </Text>
          <Group justify="flex-end">
            <Button onClick={closeDeleteModal} variant="subtle">
              キャンセル
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleDelete}>
              削除を確認
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Bonus Modal */}
      <Modal
        centered
        onClose={closeBonusModal}
        opened={bonusModalOpened}
        title="ボーナスを追加"
      >
        <form onSubmit={handleBonusSubmit}>
          <Stack>
            <NumberInput
              label="金額"
              min={1}
              placeholder="1000"
              thousandSeparator=","
              withAsterisk
              {...bonusForm.getInputProps('amount')}
            />
            <TextInput
              label="取得元"
              placeholder="例: 友達紹介、キャンペーン"
              {...bonusForm.getInputProps('source')}
            />
            <Group justify="flex-end">
              <Button onClick={closeBonusModal} variant="subtle">
                キャンセル
              </Button>
              <Button loading={isAddingBonus} type="submit">
                追加
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Add Purchase Modal */}
      <Modal
        centered
        onClose={closePurchaseModal}
        opened={purchaseModalOpened}
        title="購入を追加"
      >
        <form onSubmit={handlePurchaseSubmit}>
          <Stack>
            <NumberInput
              label="金額"
              min={1}
              placeholder="5000"
              thousandSeparator=","
              withAsterisk
              {...purchaseForm.getInputProps('amount')}
            />
            <TextInput
              label="メモ"
              placeholder="例: 月次購入"
              {...purchaseForm.getInputProps('note')}
            />
            <Group justify="flex-end">
              <Button onClick={closePurchaseModal} variant="subtle">
                キャンセル
              </Button>
              <Button loading={isAddingPurchase} type="submit">
                追加
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  )
}
