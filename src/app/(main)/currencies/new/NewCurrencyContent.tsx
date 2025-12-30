'use client'

import {
  Alert,
  Button,
  Container,
  NumberInput,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { z } from 'zod'

import { createCurrency } from '../actions/index'

const createCurrencySchema = z.object({
  name: z
    .string()
    .min(1, '通貨名を入力してください')
    .max(255, '通貨名は255文字以下で入力してください'),
  initialBalance: z
    .number()
    .int('初期残高は整数で入力してください')
    .min(0, '初期残高は0以上で入力してください'),
})

/**
 * Create new currency content client component.
 *
 * Handles form submission and navigation.
 */
export function NewCurrencyContent() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isCreating, startCreateTransition] = useTransition()

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      initialBalance: 0,
    },
    validate: zodResolver(createCurrencySchema),
  })

  const handleSubmit = form.onSubmit((values) => {
    setError(null)
    startCreateTransition(async () => {
      const result = await createCurrency(values)

      if (result.success) {
        notifications.show({
          title: '作成完了',
          message: '通貨を作成しました',
          color: 'green',
        })
        router.push(`/currencies/${result.data.id}`)
      } else {
        setError(result.error)
      }
    })
  })

  return (
    <Container py="xl" size="sm">
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

        <Title order={1}>新しい通貨を作成</Title>
        <Text c="dimmed">
          アミューズメントポーカー店舗で使用する通貨を登録します
        </Text>
      </Stack>

      <Paper mt="xl" p="xl" radius="md" shadow="md" withBorder>
        {error && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            mb="md"
            title="エラー"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack>
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
            <Button fullWidth loading={isCreating} mt="md" type="submit">
              作成
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
