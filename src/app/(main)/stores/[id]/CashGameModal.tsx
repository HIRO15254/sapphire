'use client'

import {
  Button,
  Collapse,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { RichTextEditor } from '~/components/ui/RichTextEditor'
import type { CashGame, Currency } from './types'

// Helper to handle NumberInput empty string -> null conversion
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.number().int().positive().nullable(),
)

const cashGameSchema = z.object({
  currencyId: z
    .string()
    .uuid('通貨を選択してください')
    .optional()
    .or(z.literal('')),
  smallBlind: z
    .number()
    .int('SBは整数で入力してください')
    .positive('SBは正の数で入力してください'),
  bigBlind: z
    .number()
    .int('BBは整数で入力してください')
    .positive('BBは正の数で入力してください'),
  straddle1: optionalNumber,
  straddle2: optionalNumber,
  ante: optionalNumber,
  anteType: z
    .enum(['bb_ante', 'all_ante'])
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z.string().optional(),
})

interface CashGameModalProps {
  opened: boolean
  onClose: () => void
  currencies: Currency[]
  editingCashGame: CashGame | null
  onSubmit: (values: z.infer<typeof cashGameSchema>) => void
  isLoading: boolean
}

export function CashGameModal({
  opened,
  onClose,
  currencies,
  editingCashGame,
  onSubmit,
  isLoading,
}: CashGameModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      currencyId: '',
      smallBlind: 0,
      bigBlind: 0,
      straddle1: null as number | null,
      straddle2: null as number | null,
      ante: null as number | null,
      anteType: '' as '' | 'bb_ante' | 'all_ante',
      notes: '',
    },
    validate: zodResolver(cashGameSchema),
  })

  // Reset form when modal opens or editing game changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: form methods are stable
  useEffect(() => {
    if (opened) {
      if (editingCashGame) {
        setShowAdvanced(
          !!(
            editingCashGame.straddle1 ||
            editingCashGame.straddle2 ||
            editingCashGame.ante
          ),
        )
        form.setValues({
          currencyId: editingCashGame.currencyId ?? '',
          smallBlind: editingCashGame.smallBlind,
          bigBlind: editingCashGame.bigBlind,
          straddle1: editingCashGame.straddle1,
          straddle2: editingCashGame.straddle2,
          ante: editingCashGame.ante,
          anteType: (editingCashGame.anteType ?? '') as '' | 'bb_ante' | 'all_ante',
          notes: editingCashGame.notes ?? '',
        })
      } else {
        form.reset()
        setShowAdvanced(false)
      }
    }
  }, [opened, editingCashGame])

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(values)
  })

  const currencyOptions = currencies.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <Modal
      centered
      onClose={handleClose}
      opened={opened}
      size="lg"
      title={
        editingCashGame ? 'キャッシュゲームを編集' : 'キャッシュゲームを追加'
      }
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <Select
            clearable
            data={currencyOptions}
            label="通貨"
            placeholder="選択してください"
            {...form.getInputProps('currencyId')}
          />
          <Group grow>
            <NumberInput
              label="SB"
              min={1}
              placeholder="100"
              thousandSeparator=","
              withAsterisk
              {...form.getInputProps('smallBlind')}
            />
            <NumberInput
              label="BB"
              min={1}
              placeholder="200"
              thousandSeparator=","
              withAsterisk
              {...form.getInputProps('bigBlind')}
            />
          </Group>
          <Button
            leftSection={
              showAdvanced ? (
                <IconChevronUp size={14} />
              ) : (
                <IconChevronDown size={14} />
              )
            }
            onClick={() => setShowAdvanced(!showAdvanced)}
            size="compact-sm"
            variant="subtle"
          >
            追加設定
          </Button>
          <Collapse in={showAdvanced}>
            <Stack gap="md">
              <Group grow>
                <NumberInput
                  label="ストラドル1"
                  min={1}
                  placeholder="400"
                  thousandSeparator=","
                  {...form.getInputProps('straddle1')}
                />
                <NumberInput
                  label="ストラドル2"
                  min={1}
                  placeholder="800"
                  thousandSeparator=","
                  {...form.getInputProps('straddle2')}
                />
              </Group>
              <Group grow>
                <NumberInput
                  label="アンティ"
                  min={1}
                  placeholder="200"
                  thousandSeparator=","
                  {...form.getInputProps('ante')}
                />
                <Select
                  clearable
                  data={[
                    { value: 'bb_ante', label: 'BBアンティ' },
                    { value: 'all_ante', label: '全員アンティ' },
                  ]}
                  description="アンティがある場合のみ選択"
                  label="アンティタイプ"
                  placeholder="選択してください"
                  {...form.getInputProps('anteType')}
                />
              </Group>
            </Stack>
          </Collapse>
          <Stack gap="xs">
            <Text fw={500} size="sm">
              メモ
            </Text>
            <RichTextEditor
              content={form.getValues().notes ?? ''}
              onChange={(value) => form.setFieldValue('notes', value)}
            />
          </Stack>
          <Group justify="flex-end">
            <Button onClick={handleClose} variant="subtle">
              キャンセル
            </Button>
            <Button loading={isLoading} type="submit">
              {editingCashGame ? '更新' : '追加'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
