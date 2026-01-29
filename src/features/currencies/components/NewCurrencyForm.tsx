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
          description="e.g. ABC Poker Chips, XYZ Amusement"
          label="Currency Name"
          placeholder="Enter currency name"
          withAsterisk
          {...form.getInputProps('name')}
        />
        <NumberInput
          description="Starting balance for this currency (integer, 0 or above)"
          label="Initial Balance"
          min={0}
          placeholder="0"
          thousandSeparator=","
          {...form.getInputProps('initialBalance')}
        />
        <Group gap="sm" justify="flex-end" mt="md">
          <Button onClick={handleCancel} variant="subtle">
            Cancel
          </Button>
          <Button loading={isSubmitting} type="submit">
            Create
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
