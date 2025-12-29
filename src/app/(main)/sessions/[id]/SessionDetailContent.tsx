'use client'

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
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
  IconArrowLeft,
  IconCalendar,
  IconChartBar,
  IconEdit,
  IconPlus,
  IconPokerChip,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp,
  IconTrophy,
} from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { z } from 'zod'

import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import { createAllInRecord, deleteAllInRecord, updateAllInRecord } from '../actions'

type Session = RouterOutputs['session']['getById']
type AllInRecord = Session['allInRecords'][number]

// All-in record form validation schema
const allInFormSchema = z
  .object({
    potAmount: z
      .number({ required_error: 'ポット額を入力してください' })
      .int('ポット額は整数で入力してください')
      .positive('ポット額は1以上で入力してください'),
    winProbability: z
      .string()
      .min(1, '勝率を入力してください')
      .refine(
        (val) => {
          const num = Number.parseFloat(val)
          return !Number.isNaN(num) && num >= 0 && num <= 100
        },
        { message: '勝率は0〜100の数値で入力してください' },
      ),
    actualResult: z.enum(['win', 'lose']),
    useRunIt: z.boolean(),
    runItTimes: z.number().int().min(2).max(10).optional().nullable(),
    winsInRunout: z.number().int().min(0).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.useRunIt && data.runItTimes != null && data.winsInRunout != null) {
        return data.winsInRunout <= data.runItTimes
      }
      return true
    },
    { message: '勝利回数はRun it回数以下で入力してください', path: ['winsInRunout'] },
  )

interface SessionDetailContentProps {
  initialSession: Session
}

/**
 * Session detail content client component.
 *
 * Shows session details with profit/loss, all-in records, and EV summary.
 */
export function SessionDetailContent({
  initialSession,
}: SessionDetailContentProps) {
  const router = useRouter()
  const session = initialSession

  // State for editing all-in record
  const [editingAllIn, setEditingAllIn] = useState<AllInRecord | null>(null)

  // Modal states
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false)
  const [
    allInModalOpened,
    { open: openAllInModal, close: closeAllInModal },
  ] = useDisclosure(false)
  const [
    deleteAllInModalOpened,
    { open: openDeleteAllInModal, close: closeDeleteAllInModal },
  ] = useDisclosure(false)
  const [deletingAllInId, setDeletingAllInId] = useState<string | null>(null)

  // Transition states
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isSavingAllIn, startSaveAllInTransition] = useTransition()
  const [isDeletingAllIn, startDeleteAllInTransition] = useTransition()

  // Delete mutation
  const deleteMutation = api.session.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        title: '削除完了',
        message: 'セッションを削除しました',
        color: 'green',
      })
      router.push('/sessions')
    },
    onError: (error) => {
      notifications.show({
        title: 'エラー',
        message: error.message,
        color: 'red',
      })
    },
  })

  // All-in record form
  const allInForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      potAmount: 0,
      winProbability: '50',
      actualResult: 'win' as 'win' | 'lose',
      useRunIt: false,
      runItTimes: 2 as number | null,
      winsInRunout: 1 as number | null,
    },
    validate: zodResolver(allInFormSchema),
  })

  /**
   * Format date only (e.g., 2025/12/29).
   */
  const formatDate = (date: Date) => {
    const d = new Date(date)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  }

  /**
   * Format time only (e.g., 22:30).
   */
  const formatTime = (date: Date) => {
    const d = new Date(date)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  /**
   * Format session duration (e.g., "2.0h (22:30-0:30)").
   */
  const formatSessionDuration = (startTime: Date, endTime: Date | null) => {
    const start = new Date(startTime)
    const startStr = formatTime(start)

    if (!endTime) {
      return `(${startStr}-)`
    }

    const end = new Date(endTime)
    const endStr = formatTime(end)
    const durationMs = end.getTime() - start.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    return `${durationHours.toFixed(1)}h (${startStr}-${endStr})`
  }

  /**
   * Format profit/loss with + or - prefix.
   */
  const formatProfitLoss = (profitLoss: number | null) => {
    if (profitLoss === null) return '-'
    const formatted = Math.abs(profitLoss).toLocaleString('ja-JP')
    if (profitLoss > 0) return `+${formatted}`
    if (profitLoss < 0) return `-${formatted}`
    return formatted
  }

  /**
   * Get color based on profit/loss.
   */
  const getProfitLossColor = (profitLoss: number | null) => {
    if (profitLoss === null) return 'dimmed'
    if (profitLoss > 0) return 'green'
    if (profitLoss < 0) return 'red'
    return 'dimmed'
  }

  /**
   * Format EV value (no sign prefix since EV is always positive).
   */
  const formatEV = (value: number) => {
    return value.toLocaleString('ja-JP', { maximumFractionDigits: 0 })
  }

  const handleDelete = () => {
    closeDeleteModal()
    startDeleteTransition(() => {
      deleteMutation.mutate({ id: session.id })
    })
  }

  // Open all-in modal for create
  const openAllInForCreate = () => {
    setEditingAllIn(null)
    allInForm.reset()
    openAllInModal()
  }

  // Open all-in modal for edit
  const openAllInForEdit = (record: AllInRecord) => {
    setEditingAllIn(record)
    const hasRunIt = record.runItTimes != null && record.runItTimes > 1
    allInForm.setValues({
      potAmount: record.potAmount,
      winProbability: record.winProbability,
      actualResult: record.actualResult ? 'win' : 'lose',
      useRunIt: hasRunIt,
      runItTimes: record.runItTimes ?? 2,
      winsInRunout: record.winsInRunout ?? 1,
    })
    openAllInModal()
  }

  // Handle all-in form submit
  const handleAllInSubmit = allInForm.onSubmit((values) => {
    const winProbabilityNum = Number.parseFloat(values.winProbability)
    startSaveAllInTransition(async () => {
      if (editingAllIn) {
        // Update existing record
        const result = await updateAllInRecord({
          id: editingAllIn.id,
          potAmount: values.potAmount,
          winProbability: winProbabilityNum,
          actualResult: values.useRunIt
            ? (values.winsInRunout ?? 0) > 0
            : values.actualResult === 'win',
          runItTimes: values.useRunIt ? values.runItTimes : null,
          winsInRunout: values.useRunIt ? values.winsInRunout : null,
        })

        if (result.success) {
          notifications.show({
            title: '更新完了',
            message: 'オールイン記録を更新しました',
            color: 'green',
          })
          closeAllInModal()
          allInForm.reset()
          setEditingAllIn(null)
          router.refresh()
        } else {
          notifications.show({
            title: 'エラー',
            message: result.error,
            color: 'red',
          })
        }
      } else {
        // Create new record
        const result = await createAllInRecord({
          sessionId: session.id,
          potAmount: values.potAmount,
          winProbability: winProbabilityNum,
          actualResult: values.useRunIt
            ? (values.winsInRunout ?? 0) > 0
            : values.actualResult === 'win',
          runItTimes: values.useRunIt ? values.runItTimes : null,
          winsInRunout: values.useRunIt ? values.winsInRunout : null,
        })

        if (result.success) {
          notifications.show({
            title: '作成完了',
            message: 'オールイン記録を追加しました',
            color: 'green',
          })
          closeAllInModal()
          allInForm.reset()
          router.refresh()
        } else {
          notifications.show({
            title: 'エラー',
            message: result.error,
            color: 'red',
          })
        }
      }
    })
  })

  // Handle all-in delete
  const handleAllInDelete = () => {
    if (!deletingAllInId) return
    closeDeleteAllInModal()
    startDeleteAllInTransition(async () => {
      const result = await deleteAllInRecord({ id: deletingAllInId })

      if (result.success) {
        notifications.show({
          title: '削除完了',
          message: 'オールイン記録を削除しました',
          color: 'green',
        })
        setDeletingAllInId(null)
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

  // Get form values for conditional rendering
  const formValues = allInForm.getValues()

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <Button
          component={Link}
          href="/sessions"
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          w="fit-content"
        >
          セッション一覧に戻る
        </Button>

        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <Title order={1}>セッション詳細</Title>
            {session.gameType === 'tournament' ? (
              <Badge
                color="grape"
                leftSection={<IconTrophy size={12} />}
                size="lg"
              >
                トーナメント
              </Badge>
            ) : (
              <Badge
                color="blue"
                leftSection={<IconPokerChip size={12} />}
                size="lg"
              >
                キャッシュ
              </Badge>
            )}
          </Group>
          <Group>
            <Button
              component={Link}
              href={`/sessions/${session.id}/edit`}
              leftSection={<IconEdit size={16} />}
              variant="outline"
            >
              編集
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

        {/* Profit/Loss Summary */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Stack align="center" gap="md">
            <Group gap={8}>
              {session.profitLoss !== null && session.profitLoss > 0 && (
                <IconTrendingUp
                  size={32}
                  style={{ color: 'var(--mantine-color-green-6)' }}
                />
              )}
              {session.profitLoss !== null && session.profitLoss < 0 && (
                <IconTrendingDown
                  size={32}
                  style={{ color: 'var(--mantine-color-red-6)' }}
                />
              )}
              <Stack align="center" gap={0}>
                <Text
                  c={getProfitLossColor(session.profitLoss)}
                  fw={700}
                  size="3rem"
                >
                  {formatProfitLoss(session.profitLoss)}
                </Text>
                {/* EV-adjusted profit next to main profit */}
                {session.allInSummary &&
                  session.allInSummary.count > 0 &&
                  session.profitLoss !== null && (
                    <Text
                      c={getProfitLossColor(
                        session.profitLoss - session.allInSummary.evDifference,
                      )}
                      size="sm"
                    >
                      (EV: {formatProfitLoss(
                        session.profitLoss - session.allInSummary.evDifference,
                      )})
                    </Text>
                  )}
              </Stack>
            </Group>
            <Group gap="xl">
              <Stack align="center" gap={0}>
                <Text c="dimmed" size="sm">
                  Buy-in
                </Text>
                <Text fw={500} size="lg">
                  {session.buyIn.toLocaleString()}
                </Text>
              </Stack>
              <Stack align="center" gap={0}>
                <Text c="dimmed" size="sm">
                  Cash-out
                </Text>
                <Text fw={500} size="lg">
                  {(session.cashOut ?? 0).toLocaleString()}
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Card>

        {/* Session Info */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            <Group gap="sm">
              <IconCalendar size={20} />
              <Title order={3}>セッション情報</Title>
            </Group>
            <Divider />
            <Table withRowBorders={false}>
              <Table.Tbody>
                {session.store && (
                  <Table.Tr>
                    <Table.Td c="dimmed" w={120}>
                      店舗
                    </Table.Td>
                    <Table.Td fw={500}>{session.store.name}</Table.Td>
                  </Table.Tr>
                )}
                <Table.Tr>
                  <Table.Td c="dimmed" w={120}>
                    日付
                  </Table.Td>
                  <Table.Td>{formatDate(session.startTime)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td c="dimmed" w={120}>
                    セッション時間
                  </Table.Td>
                  <Table.Td>
                    {formatSessionDuration(session.startTime, session.endTime)}
                  </Table.Td>
                </Table.Tr>
                {session.cashGame && (
                  <Table.Tr>
                    <Table.Td c="dimmed" w={120}>
                      ブラインド
                    </Table.Td>
                    <Table.Td>
                      {session.cashGame.smallBlind}/{session.cashGame.bigBlind}
                      {session.cashGame.currency && (
                        <Text c="dimmed" component="span" ml="xs" size="sm">
                          ({session.cashGame.currency.name})
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                )}
                {session.tournament && (
                  <>
                    {session.tournament.name && (
                      <Table.Tr>
                        <Table.Td c="dimmed" w={120}>
                          トーナメント名
                        </Table.Td>
                        <Table.Td fw={500}>{session.tournament.name}</Table.Td>
                      </Table.Tr>
                    )}
                    <Table.Tr>
                      <Table.Td c="dimmed" w={120}>
                        バイイン
                      </Table.Td>
                      <Table.Td>
                        ¥{session.tournament.buyIn.toLocaleString()}
                        {session.tournament.rake && (
                          <Text c="dimmed" component="span" ml="xs" size="sm">
                            (レーキ: ¥{session.tournament.rake.toLocaleString()})
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  </>
                )}
                {session.notes && (
                  <Table.Tr>
                    <Table.Td c="dimmed" w={120}>
                      メモ
                    </Table.Td>
                    <Table.Td style={{ whiteSpace: 'pre-wrap' }}>
                      {session.notes}
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>

        {/* All-In Records */}
        <Card p="lg" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <IconPokerChip size={20} />
                <Title order={3}>オールイン記録</Title>
              </Group>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openAllInForCreate}
                size="sm"
                variant="light"
              >
                オールインを追加
              </Button>
            </Group>
            <Divider />
            {session.allInRecords && session.allInRecords.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ textAlign: 'right' }}>ポット</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>勝率</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>結果</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>実収支</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>操作</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {session.allInRecords.map((record) => {
                    const winProb = Number.parseFloat(record.winProbability)
                    const ev = record.potAmount * (winProb / 100)
                    const hasRunIt = record.runItTimes != null && record.runItTimes > 1
                    // Calculate actual result
                    const actualResult = hasRunIt
                      ? record.potAmount * ((record.winsInRunout ?? 0) / (record.runItTimes ?? 1))
                      : record.actualResult
                        ? record.potAmount
                        : 0
                    const evDiff = actualResult - ev
                    return (
                      <Table.Tr key={record.id}>
                        <Table.Td style={{ textAlign: 'right' }}>
                          {record.potAmount.toLocaleString()}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          {winProb.toFixed(1)}%
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          {hasRunIt ? (
                            <Badge color="blue" size="sm" variant="light">
                              {record.winsInRunout}/{record.runItTimes}
                            </Badge>
                          ) : record.actualResult ? (
                            <Badge color="green" size="sm">
                              勝ち
                            </Badge>
                          ) : (
                            <Badge color="red" size="sm">
                              負け
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Stack align="flex-end" gap={0}>
                            <Text size="sm">{formatEV(actualResult)}</Text>
                            <Text c={evDiff >= 0 ? 'green' : 'red'} size="xs">
                              (EV {formatProfitLoss(evDiff)})
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="flex-end">
                            <ActionIcon
                              onClick={() => openAllInForEdit(record)}
                              title="編集"
                              variant="subtle"
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              onClick={() => {
                                setDeletingAllInId(record.id)
                                openDeleteAllInModal()
                              }}
                              title="削除"
                              variant="subtle"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            ) : (
              <Stack align="center" gap="md" py="xl">
                <IconChartBar color="gray" size={48} />
                <Text c="dimmed" size="lg">
                  オールイン記録がありません
                </Text>
                <Text c="dimmed" size="sm">
                  オールイン記録を追加すると、EVの分析ができます
                </Text>
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Delete Session Confirmation Modal */}
      <Modal
        centered
        onClose={closeDeleteModal}
        opened={deleteModalOpened}
        title="セッションの削除"
      >
        <Stack>
          <Text>このセッションを削除しますか？この操作は取り消せません。</Text>
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

      {/* All-In Record Modal (Create/Edit) */}
      <Modal
        centered
        onClose={() => {
          closeAllInModal()
          setEditingAllIn(null)
          allInForm.reset()
        }}
        opened={allInModalOpened}
        size="md"
        title={editingAllIn ? 'オールイン記録を編集' : 'オールインを追加'}
      >
        <form onSubmit={handleAllInSubmit}>
          <Stack>
            <NumberInput
              label="ポット額"
              min={1}
              placeholder="10000"
              thousandSeparator=","
              withAsterisk
              {...allInForm.getInputProps('potAmount')}
            />
            <TextInput
              description="例: 65.5, 33.33"
              label="勝率 (%)"
              placeholder="50"
              rightSection={<Text c="dimmed" size="sm">%</Text>}
              withAsterisk
              {...allInForm.getInputProps('winProbability')}
            />

            {/* Run it X times toggle */}
            <Checkbox
              label="Run it X times"
              {...allInForm.getInputProps('useRunIt', { type: 'checkbox' })}
            />

            {formValues.useRunIt && (
              <Group grow>
                <NumberInput
                  label="Run it回数"
                  max={10}
                  min={2}
                  placeholder="2"
                  {...allInForm.getInputProps('runItTimes')}
                />
                <NumberInput
                  label="勝利回数"
                  max={formValues.runItTimes ?? 10}
                  min={0}
                  placeholder="1"
                  {...allInForm.getInputProps('winsInRunout')}
                />
              </Group>
            )}

            {!formValues.useRunIt && (
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  結果
                </Text>
                <SegmentedControl
                  data={[
                    { value: 'win', label: '勝ち' },
                    { value: 'lose', label: '負け' },
                  ]}
                  fullWidth
                  {...allInForm.getInputProps('actualResult')}
                />
              </Stack>
            )}

            <Group justify="flex-end" mt="md">
              <Button
                onClick={() => {
                  closeAllInModal()
                  setEditingAllIn(null)
                  allInForm.reset()
                }}
                variant="subtle"
              >
                キャンセル
              </Button>
              <Button loading={isSavingAllIn} type="submit">
                {editingAllIn ? '更新' : '追加'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete All-In Record Confirmation Modal */}
      <Modal
        centered
        onClose={closeDeleteAllInModal}
        opened={deleteAllInModalOpened}
        title="オールイン記録の削除"
      >
        <Stack>
          <Text>このオールイン記録を削除しますか？</Text>
          <Group justify="flex-end">
            <Button onClick={closeDeleteAllInModal} variant="subtle">
              キャンセル
            </Button>
            <Button color="red" loading={isDeletingAllIn} onClick={handleAllInDelete}>
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
