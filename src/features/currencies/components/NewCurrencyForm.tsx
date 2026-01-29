'use client'

import { Button, Group, NumberInput, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { newCurrencyFormSchema } from '../lib/schemas'

export interface NewCurrencyFormData {
  name: string
  initialBalance: number
}

interface NewCurrencyFormProps {
  onSubmit: (data: NewCurrencyFormData) => void | Promise<void>
  isSubmitting?: boolean
  onCancel: () => void
}

export function NewCurrencyForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: NewCurrencyFormProps) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      initialBalance: 0,
    },
    validate: zodResolver(newCurrencyFormSchema),
  })

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(values)
  })

  const handleCancel = () => {
    form.reset()
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md" pb="md">
        <TextInput
          description="例: ABCポーカーチップ、XYZアミューズメント"
          label="通貨名"
          placeholder="通貨の名前を入力"
          withAsterisk
          {...form.getInputProps('name')}
        />
        <NumberInput
          description="この通貨の開始時点での残高を設定します（0以上の整数）"
          label="初期残高"
          min={0}
          placeholder="0"
          thousandSeparator=","
          {...form.getInputProps('initialBalance')}
        />
        <Group gap="sm" justify="flex-end" mt="md">
          <Button onClick={handleCancel} variant="subtle">
            キャンセル
          </Button>
          <Button loading={isSubmitting} type="submit">
            作成
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
