'use client'

import {
  Button,
  Divider,
  Drawer,
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
import { useEffect, useState, useTransition } from 'react'
import { z } from 'zod'
import { GameTypeLabelWithIcon } from '~/components/sessions/GameTypeBadge'
import { api } from '~/trpc/react'
import { updateSession } from '../actions'
import {
  combineDateAndTime,
  combineEndDateTime,
  extractTimeString,
  getDateOnly,
} from './edit/dateTimeUtils'
import type { Session } from './types'

const formSchema = z.object({
  storeId: z
    .string()
    .uuid('Please select a store')
    .optional()
    .or(z.literal('')),
  gameType: z.enum(['cash', 'tournament']),
  cashGameId: z.string().uuid().optional().or(z.literal('')),
  tournamentId: z.string().uuid().optional().or(z.literal('')),
  sessionDate: z.coerce.date({ required_error: 'Date is required' }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  buyIn: z
    .number({ required_error: 'Buy-in is required' })
    .int('Buy-in must be an integer')
    .positive('Buy-in must be at least 1'),
  cashOut: z
    .number({ required_error: 'Cash-out is required' })
    .int('Cash-out must be an integer')
    .min(0, 'Cash-out must be 0 or more'),
  notes: z.string().optional(),
})

type Store = {
  id: string
  name: string
}

interface SessionEditDrawerProps {
  opened: boolean
  onClose: () => void
  session: Session
  stores: Store[]
}

export function SessionEditDrawer({
  opened,
  onClose,
  session,
  stores,
}: SessionEditDrawerProps) {
  const router = useRouter()
  const [isUpdating, startUpdateTransition] = useTransition()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    session.store?.id ?? null,
  )

  // Fetch store details for game options when a store is selected
  const { data: storeDetails } = api.store.getById.useQuery(
    { id: selectedStoreId ?? '' },
    { enabled: !!selectedStoreId },
  )

  const initialGameType =
    session.gameType === 'tournament' ? 'tournament' : 'cash'

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      storeId: session.store?.id ?? '',
      gameType: initialGameType as 'cash' | 'tournament',
      cashGameId: session.cashGame?.id ?? '',
      tournamentId: session.tournament?.id ?? '',
      sessionDate: getDateOnly(new Date(session.startTime)),
      startTime: extractTimeString(new Date(session.startTime)),
      endTime: session.endTime
        ? extractTimeString(new Date(session.endTime))
        : '',
      buyIn: session.buyIn,
      cashOut: session.cashOut ?? 0,
      notes: session.notes ?? '',
    },
    validate: zodResolver(formSchema),
  })

  // Reset form when session changes (e.g., after a different session is loaded)
  // biome-ignore lint/correctness/useExhaustiveDependencies: form.reset is stable
  useEffect(() => {
    if (opened) {
      form.reset()
      setSelectedStoreId(session.store?.id ?? null)
    }
  }, [opened, session.id])

  // Reset game selection when store changes
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: form.setFieldValue is stable
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }
    form.setFieldValue('cashGameId', '')
    form.setFieldValue('tournamentId', '')
  }, [selectedStoreId])

  const storeOptions = stores.map((store) => ({
    value: store.id,
    label: store.name,
  }))

  const cashGameOptions =
    storeDetails?.cashGames
      .filter((game) => !game.isArchived)
      .map((game) => ({
        value: game.id,
        label: `${game.smallBlind}/${game.bigBlind}${game.currency ? ` (${game.currency.name})` : ''}`,
      })) ?? []

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
    startUpdateTransition(async () => {
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

      const result = await updateSession({
        id: session.id,
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
          title: 'Updated',
          message: 'Session has been updated',
          color: 'green',
        })
        onClose()
        router.refresh()
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
    <Drawer
      offset={8}
      onClose={onClose}
      opened={opened}
      position="bottom"
      radius="md"
      size="85%"
      title="Edit Session"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
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
              {...form.getInputProps('gameType')}
            />
          </Stack>

          <Divider />

          {/* Store Selection */}
          <Select
            clearable
            data={storeOptions}
            description="Select a store to choose a game"
            label="Store"
            onChange={handleStoreChange}
            placeholder="Select store"
            searchable
            value={selectedStoreId}
          />

          {/* Game Selection */}
          {gameType === 'cash' && selectedStoreId && (
            <Select
              clearable
              data={cashGameOptions}
              disabled={cashGameOptions.length === 0}
              label="Cash Game"
              placeholder={
                cashGameOptions.length === 0
                  ? 'No cash games available'
                  : 'Select blinds'
              }
              {...form.getInputProps('cashGameId')}
            />
          )}

          {gameType === 'tournament' && selectedStoreId && (
            <Select
              clearable
              data={tournamentOptions}
              disabled={tournamentOptions.length === 0}
              label="Tournament"
              placeholder={
                tournamentOptions.length === 0
                  ? 'No tournaments available'
                  : 'Select tournament'
              }
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
            withAsterisk
            {...form.getInputProps('sessionDate')}
          />

          {/* Start/End Time */}
          <Group grow>
            <TimeInput
              label="Start Time"
              leftSection={<IconClock size={16} />}
              withAsterisk
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
              withAsterisk
              {...form.getInputProps('buyIn')}
            />
            <NumberInput
              label="Cash-out"
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
            label="Notes"
            maxRows={4}
            minRows={2}
            placeholder="Session notes..."
            {...form.getInputProps('notes')}
          />

          <Button fullWidth loading={isUpdating} mt="xs" type="submit">
            Update Session
          </Button>
        </Stack>
      </form>
    </Drawer>
  )
}
