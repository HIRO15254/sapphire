'use client'

import { Button, Container, Paper, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { z } from 'zod'

import { RichTextEditor } from '~/components/ui/RichTextEditor'
import { usePageTitle } from '~/contexts/PageTitleContext'
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
  customMapUrl: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
})

/**
 * New store content client component.
 *
 * Form for creating a new store.
 */
export function NewStoreContent() {
  usePageTitle('店舗を追加')

  const router = useRouter()
  const [isCreating, startCreateTransition] = useTransition()

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      address: '',
      customMapUrl: '',
      notes: '',
    },
    validate: zodResolver(createStoreSchema),
  })

  const handleSubmit = form.onSubmit((values) => {
    startCreateTransition(async () => {
      const result = await createStore({
        name: values.name,
        address: values.address || undefined,
        customMapUrl: values.customMapUrl || undefined,
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
              <TextInput
                description="店舗のGoogle Mapsリンクをカスタム設定できます"
                label="Google Maps URL"
                placeholder="https://maps.google.com/..."
                {...form.getInputProps('customMapUrl')}
              />
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  メモ
                </Text>
                <RichTextEditor
                  content={form.getValues().notes ?? ''}
                  onChange={(value) => form.setFieldValue('notes', value)}
                />
              </Stack>
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
