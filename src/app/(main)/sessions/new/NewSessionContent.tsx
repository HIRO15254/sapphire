'use client'

import {
  Button,
  Container,
  Divider,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { DateInput, TimeInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconPokerChip,
  IconTrophy,
} from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { z } from 'zod'

import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'
import { createArchiveSession } from '../actions'

type Store = RouterOutputs['store']['list']['stores'][number]

// Form validation schema
const formSchema = z.object({
  storeId: z.string().uuid('店舗を選択してください').optional().or(z.literal('')),
  gameType: z.enum(['cash', 'tournament']),
  cashGameId: z.string().uuid().optional().or(z.literal('')),
  tournamentId: z.string().uuid().optional().or(z.literal('')),
  sessionDate: z.coerce.date({ required_error: '日付を入力してください' }),
  startTime: z.string().min(1, '開始時間を入力してください'),
  endTime: z.string().optional(),
  buyIn: z
    .number({ required_error: 'バイイン額を入力してください' })
    .int('バイイン額は整数で入力してください')
    .positive('バイイン額は1以上で入力してください'),
  cashOut: z
    .number({ required_error: 'キャッシュアウト額を入力してください' })
    .int('キャッシュアウト額は整数で入力してください')
    .min(0, 'キャッシュアウト額は0以上で入力してください'),
  notes: z.string().optional(),
})

/**
 * Combine date and time string into a Date object.
 */
function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return result
}

/**
 * Combine date and end time, adjusting for next day if end time is before start time.
 */
function combineEndDateTime(date: Date, startTimeStr: string, endTimeStr: string): Date {
  const startTime = combineDateAndTime(date, startTimeStr)
  const endTime = combineDateAndTime(date, endTimeStr)

  // If end time is before start time, it's the next day
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1)
  }

  return endTime
}

interface NewSessionContentProps {
  stores: Store[]
}

/**
 * New session content client component.
 *
 * Form for creating a new archive session with store/game selection.
 */
export function NewSessionContent({
  stores,
}: NewSessionContentProps) {
  const router = useRouter()
  const [isCreating, startCreateTransition] = useTransition()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  // Fetch store details when a store is selected
  const { data: storeDetails } = api.store.getById.useQuery(
    { id: selectedStoreId ?? '' },
    { enabled: !!selectedStoreId },
  )

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      storeId: '',
      gameType: 'cash' as 'cash' | 'tournament',
      cashGameId: '',
      tournamentId: '',
      sessionDate: new Date(),
      startTime: '',
      endTime: '',
      buyIn: 0,
      cashOut: 0,
      notes: '',
    },
    validate: zodResolver(formSchema),
  })

  // Reset game selection when store changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: form.setFieldValue is stable, selectedStoreId is the actual trigger
  useEffect(() => {
    form.setFieldValue('cashGameId', '')
    form.setFieldValue('tournamentId', '')
  }, [selectedStoreId])

  // Store options for select
  const storeOptions = stores.map((store) => ({
    value: store.id,
    label: store.name,
  }))

  // Cash game options (from selected store)
  const cashGameOptions =
    storeDetails?.cashGames
      .filter((game) => !game.isArchived)
      .map((game) => ({
        value: game.id,
        label: `${game.smallBlind}/${game.bigBlind}${game.currency ? ` (${game.currency.name})` : ''}`,
      })) ?? []

  // Tournament options (from selected store)
  const tournamentOptions =
    storeDetails?.tournaments
      .filter((tournament) => !tournament.isArchived)
      .map((tournament) => ({
        value: tournament.id,
        label:
          tournament.name ??
          `${tournament.buyIn.toLocaleString()}${tournament.currency ? ` (${tournament.currency.name})` : ''}`,
      })) ?? []

  const handleStoreChange = (value: string | null) => {
    setSelectedStoreId(value)
    form.setFieldValue('storeId', value ?? '')
  }

  const handleSubmit = form.onSubmit((values) => {
    startCreateTransition(async () => {
      // Combine date and time (end time adjusts to next day if before start time)
      const startDateTime = combineDateAndTime(values.sessionDate, values.startTime)
      const endDateTime = values.endTime
        ? combineEndDateTime(values.sessionDate, values.startTime, values.endTime)
        : undefined

      const result = await createArchiveSession({
        storeId: values.storeId || undefined,
        gameType: values.gameType,
        cashGameId:
          values.gameType === 'cash' && values.cashGameId
            ? values.cashGameId
            : undefined,
        tournamentId:
          values.gameType === 'tournament' && values.tournamentId
            ? values.tournamentId
            : undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        buyIn: values.buyIn,
        cashOut: values.cashOut,
        notes: values.notes || undefined,
      })

      if (result.success) {
        notifications.show({
          title: '記録完了',
          message: 'セッションを記録しました',
          color: 'green',
        })
        router.push(`/sessions/${result.data.id}`)
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  })

  const gameType = form.getValues().gameType

  return (
    <Container py="xl" size="sm">
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

        <Title order={1}>セッションを記録</Title>

        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              {/* Game Type Selection */}
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  ゲームタイプ
                </Text>
                <SegmentedControl
                  data={[
                    {
                      value: 'cash',
                      label: (
                        <Group gap={4}>
                          <IconPokerChip size={16} />
                          <span>キャッシュ</span>
                        </Group>
                      ),
                    },
                    {
                      value: 'tournament',
                      label: (
                        <Group gap={4}>
                          <IconTrophy size={16} />
                          <span>トーナメント</span>
                        </Group>
                      ),
                    },
                  ]}
                  fullWidth
                  {...form.getInputProps('gameType')}
                />
              </Stack>

              <Divider />

              {/* Store Selection */}
              <Select
                clearable
                data={storeOptions}
                description="店舗を選択するとゲームを選択できます"
                label="店舗"
                onChange={handleStoreChange}
                placeholder="店舗を選択"
                searchable
                value={selectedStoreId}
              />

              {/* Game Selection based on type */}
              {gameType === 'cash' && selectedStoreId && (
                <Select
                  clearable
                  data={cashGameOptions}
                  disabled={cashGameOptions.length === 0}
                  label="キャッシュゲーム"
                  placeholder={
                    cashGameOptions.length === 0
                      ? 'キャッシュゲームがありません'
                      : 'ブラインドを選択'
                  }
                  {...form.getInputProps('cashGameId')}
                />
              )}

              {gameType === 'tournament' && selectedStoreId && (
                <Select
                  clearable
                  data={tournamentOptions}
                  disabled={tournamentOptions.length === 0}
                  label="トーナメント"
                  placeholder={
                    tournamentOptions.length === 0
                      ? 'トーナメントがありません'
                      : 'トーナメントを選択'
                  }
                  {...form.getInputProps('tournamentId')}
                />
              )}

              <Divider />

              {/* Date */}
              <DateInput
                label="日付"
                leftSection={<IconCalendar size={16} />}
                placeholder="日付を選択"
                valueFormat="YYYY/MM/DD"
                withAsterisk
                {...form.getInputProps('sessionDate')}
              />

              {/* Start/End Time */}
              <Group grow>
                <TimeInput
                  label="開始時間"
                  leftSection={<IconClock size={16} />}
                  withAsterisk
                  {...form.getInputProps('startTime')}
                />
                <TimeInput
                  label="終了時間"
                  leftSection={<IconClock size={16} />}
                  {...form.getInputProps('endTime')}
                />
              </Group>

              <Divider />

              {/* Buy-in and Cash-out */}
              <Group grow>
                <NumberInput
                  label="バイイン"
                  min={1}
                  placeholder="10000"
                  thousandSeparator=","
                  withAsterisk
                  {...form.getInputProps('buyIn')}
                />
                <NumberInput
                  label="キャッシュアウト"
                  min={0}
                  placeholder="15000"
                  thousandSeparator=","
                  withAsterisk
                  {...form.getInputProps('cashOut')}
                />
              </Group>

              {/* Notes */}
              <Textarea
                autosize
                label="メモ"
                maxRows={6}
                minRows={3}
                placeholder="セッションのメモ..."
                {...form.getInputProps('notes')}
              />

              <Button fullWidth loading={isCreating} mt="md" type="submit">
                セッションを記録
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  )
}
