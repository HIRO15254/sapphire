'use client'

import {
  Button,
  Container,
  Paper,
  Stack,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { z } from 'zod'

import { createStore } from '../actions'

// Schema for form
const createStoreSchema = z.object({
  name: z
    .string()
    .min(1, '店舗名を入力してください')
    .max(255, '店舗名は255文字以下で入力してください'),
  address: z
    .string()
    .max(500, '住所は500文字以下で入力してください')
    .optional(),
  notes: z.string().optional(),
})

/**
 * New store content client component.
 *
 * Form for creating a new store.
 */
export function NewStoreContent() {
  const router = useRouter()
  const [isCreating, startCreateTransition] = useTransition()

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      address: '',
      notes: '',
    },
    validate: zodResolver(createStoreSchema),
  })

  const handleSubmit = form.onSubmit((values) => {
    startCreateTransition(async () => {
      const result = await createStore({
        name: values.name,
        address: values.address || undefined,
        notes: values.notes || undefined,
      })

      if (result.success) {
        notifications.show({
          title: '作成完了',
          message: '店舗を作成しました',
          color: 'green',
        })
        router.push(`/stores/${result.data.id}`)
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  })

  return (
    <Container py="xl" size="sm">
      <Stack gap="lg">
        <Button
          component={Link}
          href="/stores"
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          w="fit-content"
        >
          店舗一覧に戻る
        </Button>

        <Title order={1}>新しい店舗を追加</Title>

        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="店舗名"
                placeholder="例: Poker Stars Tokyo"
                withAsterisk
                {...form.getInputProps('name')}
              />
              <TextInput
                label="住所"
                placeholder="例: 東京都渋谷区..."
                {...form.getInputProps('address')}
              />
              <Textarea
                label="メモ"
                minRows={3}
                placeholder="店舗に関するメモを入力"
                {...form.getInputProps('notes')}
              />
              <Button fullWidth loading={isCreating} mt="md" type="submit">
                店舗を作成
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  )
}
