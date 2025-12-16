'use client'

import {
  Alert,
  Anchor,
  Button,
  Container,
  Divider,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconBrandDiscord, IconBrandGoogle } from '@tabler/icons-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const error = searchParams.get('error')
  const [isLoading, setIsLoading] = useState(false)
  const [credentialsError, setCredentialsError] = useState<string | null>(null)

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : '有効なメールアドレスを入力してください',
      password: (value) =>
        value.length > 0 ? null : 'パスワードを入力してください',
    },
  })

  const handleCredentialsSubmit = form.onSubmit(async (values) => {
    setIsLoading(true)
    setCredentialsError(null)

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      callbackUrl,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setCredentialsError('メールアドレスまたはパスワードが正しくありません')
    } else if (result?.ok) {
      window.location.href = callbackUrl
    }
  })

  const handleOAuthSignIn = (provider: string) => {
    setIsLoading(true)
    signIn(provider, { callbackUrl })
  }

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'OAuthAccountNotLinked':
        return 'このメールアドレスは別の方法で登録されています'
      case 'CredentialsSignin':
        return 'メールアドレスまたはパスワードが正しくありません'
      case 'AccessDenied':
        return 'アクセスが拒否されました'
      default:
        return errorCode ? 'ログインに失敗しました' : null
    }
  }

  const errorMessage = getErrorMessage(error) ?? credentialsError

  return (
    <Container py="xl" size="xs">
      <Stack align="center" gap="lg">
        <Title order={1}>ログイン</Title>
        <Text c="dimmed" ta="center">
          ポーカーセッショントラッカーにログイン
        </Text>
      </Stack>

      <Paper mt="xl" p="xl" radius="md" shadow="md" withBorder>
        {errorMessage && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            mb="md"
            title="エラー"
          >
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleCredentialsSubmit}>
          <Stack>
            <TextInput
              label="メールアドレス"
              placeholder="you@example.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="パスワード"
              placeholder="パスワードを入力"
              required
              {...form.getInputProps('password')}
            />
            <Button
              fullWidth
              loading={isLoading}
              mt="md"
              type="submit"
            >
              ログイン
            </Button>
          </Stack>
        </form>

        <Divider label="または" labelPosition="center" my="lg" />

        <Stack>
          <Button
            leftSection={<IconBrandGoogle size={18} />}
            onClick={() => handleOAuthSignIn('google')}
            variant="default"
          >
            Googleでログイン
          </Button>
          <Button
            leftSection={<IconBrandDiscord size={18} />}
            onClick={() => handleOAuthSignIn('discord')}
            variant="default"
          >
            Discordでログイン
          </Button>
        </Stack>

        <Text c="dimmed" mt="md" size="sm" ta="center">
          アカウントをお持ちでないですか？{' '}
          <Anchor component={Link} href="/auth/register" size="sm">
            新規登録
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
