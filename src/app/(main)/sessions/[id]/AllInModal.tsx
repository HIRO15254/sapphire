'use client'

import {
  Button,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { IconClock } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useEffect } from 'react'
import { z } from 'zod'

import type { AllInRecord } from './types'

/**
 * Get current time as HH:MM string.
 */
const getCurrentTimeString = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Format Date to HH:MM string.
 */
const formatTimeString = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// All-in record form validation schema
const allInFormSchema = z
  .object({
    recordedAt: z.string().min(1, '発生時刻を入力してください'),
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
      if (
        data.useRunIt &&
        data.runItTimes != null &&
        data.winsInRunout != null
      ) {
        return data.winsInRunout <= data.runItTimes
      }
      return true
    },
    {
      message: '勝利回数はRun it回数以下で入力してください',
      path: ['winsInRunout'],
    },
  )

export type AllInFormValues = z.infer<typeof allInFormSchema>

interface AllInModalProps {
  opened: boolean
  onClose: () => void
  editingAllIn: AllInRecord | null
  onSubmit: (values: AllInFormValues) => void
  isLoading: boolean
  minTime?: Date
}

export function AllInModal({
  opened,
  onClose,
  editingAllIn,
  onSubmit,
  isLoading,
  minTime,
}: AllInModalProps) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      recordedAt: getCurrentTimeString(),
      potAmount: 0,
      winProbability: '50',
      actualResult: 'win' as 'win' | 'lose',
      useRunIt: false,
      runItTimes: 2 as number | null,
      winsInRunout: 1 as number | null,
    },
    validate: zodResolver(allInFormSchema),
  })

  // Reset form when modal opens or editing record changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: form methods are stable
  useEffect(() => {
    if (opened) {
      if (editingAllIn) {
        const hasRunIt =
          editingAllIn.runItTimes != null && editingAllIn.runItTimes > 1
        form.setValues({
          recordedAt: formatTimeString(new Date(editingAllIn.recordedAt)),
          potAmount: editingAllIn.potAmount,
          winProbability: editingAllIn.winProbability,
          actualResult: editingAllIn.actualResult ? 'win' : 'lose',
          useRunIt: hasRunIt,
          runItTimes: editingAllIn.runItTimes ?? 2,
          winsInRunout: editingAllIn.winsInRunout ?? 1,
        })
      } else {
        form.setValues({
          recordedAt: getCurrentTimeString(),
          potAmount: 0,
          winProbability: '50',
          actualResult: 'win',
          useRunIt: false,
          runItTimes: 2,
          winsInRunout: 1,
        })
      }
    }
  }, [opened, editingAllIn])

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(values)
  })

  // Get form values for conditional rendering
  const formValues = form.getValues()

  return (
    <Modal
      centered
      onClose={handleClose}
      opened={opened}
      size="md"
      title={editingAllIn ? 'オールイン記録を編集' : 'オールインを追加'}
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <TimeInput
            description={minTime ? `${formatTimeString(minTime)}より後` : undefined}
            label="発生時刻"
            leftSection={<IconClock size={16} />}
            withAsterisk
            {...form.getInputProps('recordedAt')}
          />
          <NumberInput
            label="ポット額"
            min={1}
            placeholder="10000"
            thousandSeparator=","
            withAsterisk
            {...form.getInputProps('potAmount')}
          />
          <TextInput
            description="例: 65.5, 33.33"
            label="勝率 (%)"
            placeholder="50"
            rightSection={
              <Text c="dimmed" size="sm">
                %
              </Text>
            }
            withAsterisk
            {...form.getInputProps('winProbability')}
          />

          {/* Run it X times toggle */}
          <Checkbox
            label="Run it X times"
            {...form.getInputProps('useRunIt', { type: 'checkbox' })}
          />

          {formValues.useRunIt && (
            <Group grow>
              <NumberInput
                label="Run it回数"
                max={10}
                min={2}
                placeholder="2"
                {...form.getInputProps('runItTimes')}
              />
              <NumberInput
                label="勝利回数"
                max={formValues.runItTimes ?? 10}
                min={0}
                placeholder="1"
                {...form.getInputProps('winsInRunout')}
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
                {...form.getInputProps('actualResult')}
              />
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button onClick={handleClose} variant="subtle">
              キャンセル
            </Button>
            <Button loading={isLoading} type="submit">
              {editingAllIn ? '更新' : '追加'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
