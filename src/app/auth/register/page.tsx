'use client'

import {
  Alert,
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { api } from '~/trpc/react'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : '有効なメールアドレスを入力してください',
      password: (value) =>
        value.length >= 8 ? null : 'パスワードは8文字以上で入力してください',
      confirmPassword: (value, values) =>
        value === values.password ? null : 'パスワードが一致しません',
      name: (value) =>
        value.length > 0 ? null : '名前を入力してください',
    },
  })

  const registerMutation = api.auth.register.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      // Redirect to signin after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
    },
    onError: (err) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  const handleSubmit = form.onSubmit((values) => {
    setError(null)
    registerMutation.mutate({
      email: values.email,
      password: values.password,
      name: values.name || undefined,
    })
  })

  return (
    <Container py="xl" size="xs">
      <Stack align="center" gap="lg">
        <Title order={1}>新規登録</Title>
        <Text c="dimmed" ta="center">
          アカウントを作成してポーカーセッションを記録しましょう
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

        {success && (
          <Alert
            color="green"
            icon={<IconCheck size={16} />}
            mb="md"
            title="登録完了"
          >
            アカウントが作成されました。ログインページへ移動します...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="名前"
              placeholder="山田 太郎"
              required
              {...form.getInputProps('name')}
            />
            <TextInput
              label="メールアドレス"
              placeholder="you@example.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="パスワード"
              placeholder="8文字以上"
              required
              {...form.getInputProps('password')}
            />
            <PasswordInput
              label="パスワード（確認）"
              placeholder="もう一度入力"
              required
              {...form.getInputProps('confirmPassword')}
            />
            <Button
              disabled={success}
              fullWidth
              loading={registerMutation.isPending}
              mt="md"
              type="submit"
            >
              登録
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" mt="md" size="sm" ta="center">
          既にアカウントをお持ちですか？{' '}
          <Anchor component={Link} href="/auth/signin" size="sm">
            ログイン
          </Anchor>
        </Text>
      </Paper>

      <Button
        component={Link}
        href="/"
        mt="lg"
        variant="subtle"
        w="100%"
      >
        ホームに戻る
      </Button>
    </Container>
  )
}
