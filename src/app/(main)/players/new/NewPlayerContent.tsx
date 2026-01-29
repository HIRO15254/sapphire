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
import { createPlayer } from '../actions'

// Schema for form
const createPlayerFormSchema = z.object({
  name: z
    .string()
    .min(1, 'プレイヤー名を入力してください')
    .max(255, 'プレイヤー名は255文字以下で入力してください'),
  generalNotes: z.string().optional(),
})

/**
 * New player content client component.
 *
 * Form for creating a new player.
 */
export function NewPlayerContent() {
  usePageTitle('プレイヤーを追加')

  const router = useRouter()
  const [isCreating, startCreateTransition] = useTransition()

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      generalNotes: '',
    },
    validate: zodResolver(createPlayerFormSchema),
  })

  const handleSubmit = form.onSubmit((values) => {
    startCreateTransition(async () => {
      const result = await createPlayer({
        name: values.name,
        generalNotes: values.generalNotes || undefined,
      })

      if (result.success) {
        notifications.show({
          title: '作成完了',
          message: 'プレイヤーを作成しました',
          color: 'green',
        })
        router.push(`/players/${result.data.id}`)
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
          href="/players"
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          w="fit-content"
        >
          プレイヤー一覧に戻る
        </Button>

        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="プレイヤー名"
                placeholder="例: 田中太郎"
                withAsterisk
                {...form.getInputProps('name')}
              />
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  メモ
                </Text>
                <RichTextEditor
                  content={form.getValues().generalNotes ?? ''}
                  onChange={(value) =>
                    form.setFieldValue('generalNotes', value)
                  }
                />
              </Stack>
              <Button fullWidth loading={isCreating} mt="md" type="submit">
                作成
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  )
}
