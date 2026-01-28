'use client'

import {
  Button,
  Divider,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core'
import { DateInput, TimeInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconCalendar, IconClock } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { z } from 'zod'
import { GameTypeLabelWithIcon } from '~/components/sessions/GameTypeBadge'
import type { RouterOutputs } from '~/trpc/react'
import { createArchiveSession } from './actions'

// Form validation schema
const formSchema = z.object({
  storeId: z
    .string()
    .uuid('Select a store')
    .optional()
    .or(z.literal('')),
  gameType: z.enum(['cash', 'tournament']),
  cashGameId: z.string().uuid().optional().or(z.literal('')),
  tournamentId: z.string().uuid().optional().or(z.literal('')),
  sessionDate: z.coerce.date({ required_error: 'Enter a date' }),
  startTime: z.string().min(1, 'Enter start time'),
  endTime: z.string().optional(),
  buyIn: z
    .number({ required_error: 'Enter buy-in amount' })
    .int('Buy-in must be an integer')
    .positive('Buy-in must be at least 1'),
  cashOut: z
    .number({ required_error: 'Enter cash-out amount' })
    .int('Cash-out must be an integer')
    .min(0, 'Cash-out must be at least 0'),
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
function combineEndDateTime(
  date: Date,
  startTimeStr: string,
  endTimeStr: string,
): Date {
  const startTime = combineDateAndTime(date, startTimeStr)
  const endTime = combineDateAndTime(date, endTimeStr)

  // If end time is before start time, it's the next day
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1)
  }

  return endTime
}

type StoreWithGames = RouterOutputs['store']['getById']

interface NewSessionFormProps {
  stores: StoreWithGames[]
  onCancel: () => void
  onSuccess?: () => void
}

/**
 * New session form component.
 *
 * Reusable form for creating a new session.
 */
export function NewSessionForm({
  stores,
  onCancel,
  onSuccess,
}: NewSessionFormProps) {
  const router = useRouter()
  const [isCreating, startCreateTransition] = useTransition()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  // Get selected store details from passed data
  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId),
    [stores, selectedStoreId],
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

  /**
   * Reset form to initial state.
   */
  const resetForm = () => {
    form.reset()
    setSelectedStoreId(null)
  }

  // Store options for select
  const storeOptions = stores.map((store) => ({
    value: store.id,
    label: store.name,
  }))

  // Cash game options (from selected store)
  const cashGameOptions = useMemo(
    () =>
      selectedStore?.cashGames
        .filter((game) => !game.isArchived)
        .map((game) => ({
          value: game.id,
          label: `${game.smallBlind}/${game.bigBlind}${game.currency ? ` (${game.currency.name})` : ''}`,
        })) ?? [],
    [selectedStore],
  )

  // Tournament options (from selected store)
  const tournamentOptions = useMemo(
    () =>
      selectedStore?.tournaments
        .filter((tournament) => !tournament.isArchived)
        .map((tournament) => ({
          value: tournament.id,
          label:
            tournament.name ??
            `${tournament.buyIn.toLocaleString()}${tournament.currency ? ` (${tournament.currency.name})` : ''}`,
        })) ?? [],
    [selectedStore],
  )

  const handleStoreChange = (value: string | null) => {
    setSelectedStoreId(value)
    form.setFieldValue('storeId', value ?? '')
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  const handleSubmit = form.onSubmit((values) => {
    startCreateTransition(async () => {
      // Combine date and time (end time adjusts to next day if before start time)
      const startDateTime = combineDateAndTime(
        values.sessionDate,
        values.startTime,
      )
      const endDateTime = values.endTime
        ? combineEndDateTime(
            values.sessionDate,
            values.startTime,
            values.endTime,
          )
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
          title: 'Session Recorded',
          message: 'Your session has been saved',
          color: 'green',
        })
        resetForm()
        onSuccess?.()
        router.push(`/sessions/${result.data.id}`)
      } else {
        notifications.show({
          title: 'Error',
          message: result.error,
          color: 'red',
        })
      }
    })
  })

  const gameType = form.getValues().gameType

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md" pb="md">
        {/* Game Type */}
        <Stack gap="xs">
          <Text fw={500} size="sm">
            Game Type
          </Text>
          <SegmentedControl
            data={[
              {
                value: 'cash',
                label: <GameTypeLabelWithIcon gameType="cash" />,
              },
              {
                value: 'tournament',
                label: <GameTypeLabelWithIcon gameType="tournament" />,
              },
            ]}
            fullWidth
            size="xs"
            {...form.getInputProps('gameType')}
          />
        </Stack>

        {/* Store Selection */}
        <Select
          clearable
          comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
          data={storeOptions}
          label="Store"
          onChange={handleStoreChange}
          placeholder="Select store"
          searchable
          value={selectedStoreId}
        />

        {/* Game Selection based on type */}
        {gameType === 'cash' && selectedStoreId && (
          <Select
            clearable
            comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
            data={cashGameOptions}
            disabled={cashGameOptions.length === 0}
            label="Cash Game"
            placeholder={
              cashGameOptions.length === 0
                ? 'No cash games available'
                : 'Select blinds'
            }
            searchable
            {...form.getInputProps('cashGameId')}
          />
        )}

        {gameType === 'tournament' && selectedStoreId && (
          <Select
            clearable
            comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
            data={tournamentOptions}
            disabled={tournamentOptions.length === 0}
            label="Tournament"
            placeholder={
              tournamentOptions.length === 0
                ? 'No tournaments available'
                : 'Select tournament'
            }
            searchable
            {...form.getInputProps('tournamentId')}
          />
        )}

        <Divider />

        {/* Date */}
        <DateInput
          label="Date"
          leftSection={<IconCalendar size={16} />}
          placeholder="Select date"
          valueFormat="YYYY/MM/DD"
          {...form.getInputProps('sessionDate')}
        />

        {/* Start/End Time */}
        <Group grow>
          <TimeInput
            label="Start Time"
            leftSection={<IconClock size={16} />}
            {...form.getInputProps('startTime')}
          />
          <TimeInput
            label="End Time"
            leftSection={<IconClock size={16} />}
            {...form.getInputProps('endTime')}
          />
        </Group>

        <Divider />

        {/* Buy-in and Cash-out */}
        <Group grow>
          <NumberInput
            label="Buy-in"
            min={1}
            placeholder="10000"
            thousandSeparator=","
            {...form.getInputProps('buyIn')}
          />
          <NumberInput
            label="Cash-out"
            min={0}
            placeholder="15000"
            thousandSeparator=","
            {...form.getInputProps('cashOut')}
          />
        </Group>

        {/* Notes */}
        <Textarea
          autosize
          label="Notes"
          maxRows={4}
          minRows={2}
          placeholder="Session notes..."
          {...form.getInputProps('notes')}
        />

        <Group gap="sm" justify="flex-end" mt="md">
          <Button onClick={handleCancel} variant="subtle">
            Cancel
          </Button>
          <Button loading={isCreating} type="submit">
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
