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
import { IconCalendar, IconClock } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useEffect, useMemo, useState } from 'react'
import { GameTypeLabelWithIcon } from '~/components/sessions/GameTypeBadge'
import { combineDateAndTime, combineEndDateTime } from '../lib/date-utils'
import { newSessionFormSchema } from '../lib/schemas'

/**
 * Data submitted by the form.
 */
export interface NewSessionFormData {
  storeId?: string
  gameType: 'cash' | 'tournament'
  cashGameId?: string
  tournamentId?: string
  startTime: Date
  endTime?: Date
  buyIn: number
  cashOut: number
  notes?: string
}

interface StoreWithGames {
  id: string
  name: string
  cashGames: Array<{
    id: string
    smallBlind: number
    bigBlind: number
    currency: { name: string } | null
    isArchived: boolean
  }>
  tournaments: Array<{
    id: string
    name: string | null
    buyIn: number
    currency: { name: string } | null
    isArchived: boolean
  }>
}

interface NewSessionFormProps {
  stores: StoreWithGames[]
  onSubmit: (data: NewSessionFormData) => void
  isSubmitting: boolean
  onCancel: () => void
}

/**
 * New session form component.
 *
 * Reusable form for creating a new session.
 * Delegates submission to parent via onSubmit callback.
 */
export function NewSessionForm({
  stores,
  onSubmit,
  isSubmitting,
  onCancel,
}: NewSessionFormProps) {
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
    validate: zodResolver(newSessionFormSchema),
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
    [selectedStore?.cashGames],
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
    [selectedStore?.tournaments],
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

    onSubmit({
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
          <Button loading={isSubmitting} type="submit">
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
