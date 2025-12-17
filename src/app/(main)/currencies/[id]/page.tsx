'use client'

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconArchive,
  IconArchiveOff,
  IconArrowLeft,
  IconEdit,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'

import { api } from '~/trpc/react'

// Schemas for forms
const updateCurrencySchema = z.object({
  name: z
    .string()
    .min(1, '通貨名を入力してください')
    .max(255, '通貨名は255文字以下で入力してください'),
  initialBalance: z
    .number()
    .int('初期残高は整数で入力してください')
    .min(0, '初期残高は0以上で入力してください'),
})

const addBonusSchema = z.object({
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .positive('金額は正の数で入力してください'),
  source: z
    .string()
    .max(255, '取得元は255文字以下で入力してください')
    .optional(),
})

const addPurchaseSchema = z.object({
  amount: z
    .number()
    .int('金額は整数で入力してください')
    .positive('金額は正の数で入力してください'),
  note: z.string().optional(),
})

/**
 * Currency detail page.
 *
 * Shows currency details with balance breakdown and transaction history.
 * Provides actions to edit, archive, delete, and add transactions.
 */
export default function CurrencyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const currencyId = params.id as string

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

  const utils = api.useUtils()

  const {
    data: currency,
    isLoading,
    error,
  } = api.currency.getById.useQuery({
    id: currencyId,
  })

  // Mutations
  const updateMutation = api.currency.update.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '更新完了',
        message: '通貨を更新しました',
        color: 'green',
      })
      setEditMode(false)
      void utils.currency.getById.invalidate({ id: currencyId })
      void utils.currency.list.invalidate()
    },
    onError: (err) => {
      notifications.show({
        title: 'エラー',
        message: err.message,
        color: 'red',
      })
    },
  })

  const archiveMutation = api.currency.archive.useMutation({
    onSuccess: () => {
      notifications.show({
        title: 'アーカイブ完了',
        message: '通貨をアーカイブしました',
        color: 'green',
      })
      void utils.currency.getById.invalidate({ id: currencyId })
      void utils.currency.list.invalidate()
    },
  })

  const unarchiveMutation = api.currency.unarchive.useMutation({
    onSuccess: () => {
      notifications.show({
        title: 'アーカイブ解除完了',
        message: '通貨のアーカイブを解除しました',
        color: 'green',
      })
      void utils.currency.getById.invalidate({ id: currencyId })
      void utils.currency.list.invalidate()
    },
  })

  const deleteMutation = api.currency.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '削除完了',
        message: '通貨を削除しました',
        color: 'green',
      })
      router.push('/currencies')
    },
    onError: (err) => {
      notifications.show({
        title: 'エラー',
        message: err.message,
        color: 'red',
      })
    },
  })

  const addBonusMutation = api.currency.addBonus.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '追加完了',
        message: 'ボーナスを追加しました',
        color: 'green',
      })
      closeBonusModal()
      bonusForm.reset()
      void utils.currency.getById.invalidate({ id: currencyId })
      void utils.currency.list.invalidate()
    },
    onError: (err) => {
      notifications.show({
        title: 'エラー',
        message: err.message,
        color: 'red',
      })
    },
  })

  const addPurchaseMutation = api.currency.addPurchase.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '追加完了',
        message: '購入を追加しました',
        color: 'green',
      })
      closePurchaseModal()
      purchaseForm.reset()
      void utils.currency.getById.invalidate({ id: currencyId })
      void utils.currency.list.invalidate()
    },
    onError: (err) => {
      notifications.show({
        title: 'エラー',
        message: err.message,
        color: 'red',
      })
    },
  })

  // Forms
  const editForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: currency?.name ?? '',
      initialBalance: currency?.initialBalance ?? 0,
    },
    validate: zodResolver(updateCurrencySchema),
  })

  const bonusForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      amount: 0,
      source: '',
    },
    validate: zodResolver(addBonusSchema),
  })

  const purchaseForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      amount: 0,
      note: '',
    },
    validate: zodResolver(addPurchaseSchema),
  })

  // Event handlers
  const handleEditSubmit = editForm.onSubmit((values) => {
    updateMutation.mutate({
      id: currencyId,
      ...values,
    })
  })

  const handleBonusSubmit = bonusForm.onSubmit((values) => {
    addBonusMutation.mutate({
      currencyId,
      amount: values.amount,
      source: values.source || undefined,
    })
  })

  const handlePurchaseSubmit = purchaseForm.onSubmit((values) => {
    addPurchaseMutation.mutate({
      currencyId,
      amount: values.amount,
      note: values.note || undefined,
    })
  })

  const handleArchiveToggle = () => {
    if (currency?.isArchived) {
      unarchiveMutation.mutate({ id: currencyId })
    } else {
      archiveMutation.mutate({ id: currencyId })
    }
  }

  const handleDelete = () => {
    deleteMutation.mutate({ id: currencyId })
    closeDeleteModal()
  }

  // Update form when currency data loads
  if (currency && editForm.values.name !== currency.name) {
    editForm.setValues({
      name: currency.name,
      initialBalance: currency.initialBalance,
    })
  }

  if (isLoading) {
    return (
      <Container py="xl" size="md">
        <Stack align="center" gap="lg">
          <Loader size="lg" />
          <Text c="dimmed">読み込み中...</Text>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container py="xl" size="md">
        <Alert color="red" icon={<IconAlertCircle size={16} />} title="エラー">
          {error.message}
        </Alert>
        <Button
          component={Link}
          href="/currencies"
          leftSection={<IconArrowLeft size={16} />}
          mt="lg"
          variant="subtle"
        >
          通貨一覧に戻る
        </Button>
      </Container>
    )
  }

  if (!currency) {
    return (
      <Container py="xl" size="md">
        <Alert
          color="yellow"
          icon={<IconAlertCircle size={16} />}
          title="通貨が見つかりません"
        >
          指定された通貨は存在しないか、アクセスする権限がありません。
        </Alert>
        <Button
          component={Link}
          href="/currencies"
          leftSection={<IconArrowLeft size={16} />}
          mt="lg"
          variant="subtle"
        >
          通貨一覧に戻る
        </Button>
      </Container>
    )
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
        <Group justify="space-between">
          <Group gap="sm">
            <Title order={1}>{currency.name}</Title>
            {currency.isArchived && (
              <Badge color="gray" size="lg">
                アーカイブ済み
              </Badge>
            )}
          </Group>
          <Group>
            <Button
              leftSection={<IconEdit size={16} />}
              onClick={() => setEditMode(!editMode)}
              variant="outline"
            >
              編集
            </Button>
            <Button
              color={currency.isArchived ? 'teal' : 'gray'}
              leftSection={
                currency.isArchived ? (
                  <IconArchiveOff size={16} />
                ) : (
                  <IconArchive size={16} />
                )
              }
              loading={archiveMutation.isPending || unarchiveMutation.isPending}
              onClick={handleArchiveToggle}
              variant="outline"
            >
              {currency.isArchived ? 'アーカイブ解除' : 'アーカイブ'}
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={openDeleteModal}
              variant="outline"
            >
              削除
            </Button>
          </Group>
        </Group>

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
                  <Button loading={updateMutation.isPending} type="submit">
                    保存
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}

        {/* Balance Breakdown */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Title order={3}>残高内訳</Title>
          <Divider my="md" />
          <Stack gap="sm">
            <Group justify="space-between">
              <Text>初期残高</Text>
              <Text fw={500}>{currency.initialBalance.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text>ボーナス合計</Text>
              <Text c="teal" fw={500}>
                +{currency.totalBonuses.toLocaleString()}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text>購入合計</Text>
              <Text c="teal" fw={500}>
                +{currency.totalPurchases.toLocaleString()}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text>バイイン合計</Text>
              <Text c="red" fw={500}>
                -{currency.totalBuyIns.toLocaleString()}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text>キャッシュアウト合計</Text>
              <Text c="teal" fw={500}>
                +{currency.totalCashOuts.toLocaleString()}
              </Text>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text fw={600} size="lg">
                現在残高
              </Text>
              <Text
                c={currency.currentBalance >= 0 ? 'teal' : 'red'}
                fw={700}
                size="xl"
              >
                {currency.currentBalance.toLocaleString()}
              </Text>
            </Group>
          </Stack>
        </Card>

        {/* Transaction Actions */}
        <Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openBonusModal}
            variant="light"
          >
            ボーナスを追加
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openPurchaseModal}
            variant="light"
          >
            購入を追加
          </Button>
        </Group>

        {/* Bonus Transactions */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Title order={3}>ボーナス履歴</Title>
          <Divider my="md" />
          {currency.bonusTransactions.length === 0 ? (
            <Text c="dimmed">ボーナス履歴はありません</Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>日付</Table.Th>
                  <Table.Th>取得元</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {currency.bonusTransactions.map((bonus) => (
                  <Table.Tr key={bonus.id}>
                    <Table.Td>
                      {new Date(bonus.transactionDate).toLocaleDateString(
                        'ja-JP',
                      )}
                    </Table.Td>
                    <Table.Td>{bonus.source ?? '-'}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text c="teal" fw={500}>
                        +{bonus.amount.toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>

        {/* Purchase Transactions */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Title order={3}>購入履歴</Title>
          <Divider my="md" />
          {currency.purchaseTransactions.length === 0 ? (
            <Text c="dimmed">購入履歴はありません</Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>日付</Table.Th>
                  <Table.Th>メモ</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {currency.purchaseTransactions.map((purchase) => (
                  <Table.Tr key={purchase.id}>
                    <Table.Td>
                      {new Date(purchase.transactionDate).toLocaleDateString(
                        'ja-JP',
                      )}
                    </Table.Td>
                    <Table.Td>{purchase.note ?? '-'}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text c="teal" fw={500}>
                        +{purchase.amount.toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
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
            <Button
              color="red"
              loading={deleteMutation.isPending}
              onClick={handleDelete}
            >
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
              <Button loading={addBonusMutation.isPending} type="submit">
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
              <Button loading={addPurchaseMutation.isPending} type="submit">
                追加
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  )
}
