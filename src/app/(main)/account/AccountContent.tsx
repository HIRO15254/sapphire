'use client'

import {
  Badge,
  Button,
  Container,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBrandDiscord,
  IconBrandGoogle,
  IconLink,
  IconLinkOff,
  IconLock,
  IconMail,
} from '@tabler/icons-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useTransition } from 'react'

import { usePageTitle } from '~/contexts/PageTitleContext'

import { changePassword, setPassword, unlinkProvider } from './actions'

interface LinkedProvider {
  provider: string
  providerAccountId: string
}

interface AccountContentProps {
  linkedAccounts: {
    providers: LinkedProvider[]
    hasPassword: boolean
    email: string
  }
}

const PROVIDER_CONFIG = {
  google: { label: 'Google', icon: IconBrandGoogle, color: 'red' },
  discord: { label: 'Discord', icon: IconBrandDiscord, color: 'indigo' },
} as const

/**
 * Isolated component for reading URL search params feedback.
 * Wrapped in Suspense to avoid useSearchParams() interfering with parent.
 */
function LinkFeedback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    const linked = searchParams.get('linked')
    const error = searchParams.get('error')
    if (linked === 'success') {
      setFeedback({ type: 'success', message: 'Account linked successfully' })
      router.replace('/account')
    } else if (error) {
      setFeedback({
        type: 'error',
        message: `Failed to link account: ${error}`,
      })
      router.replace('/account')
    }
  }, [searchParams, router])

  if (!feedback) return null

  return (
    <Paper
      bg={feedback.type === 'success' ? 'teal.0' : 'red.0'}
      p="sm"
      radius="sm"
    >
      <Text c={feedback.type === 'success' ? 'teal.8' : 'red.8'} size="sm">
        {feedback.message}
      </Text>
    </Paper>
  )
}

/**
 * Password form for setting a new password (OAuth-only users).
 * Uses @mantine/form with uncontrolled mode for React 19 compatibility.
 */
function SetPasswordForm({
  email,
  isPending,
  onSuccess,
  onError,
}: {
  email: string
  isPending: boolean
  onSuccess: (message: string) => void
  onError: (message: string) => void
}) {
  const [, startTransition] = useTransition()

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) =>
        value.length < 8 ? 'Password must be at least 8 characters' : null,
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  })

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await setPassword({
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
      if (result.success) {
        onSuccess(
          `Password set successfully. You can now sign in with ${email} and your password.`,
        )
        form.reset()
      } else {
        onError(result.error)
      }
    })
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <PasswordInput
          disabled={isPending}
          label="Password"
          {...form.getInputProps('password')}
        />
        <PasswordInput
          disabled={isPending}
          label="Confirm Password"
          {...form.getInputProps('confirmPassword')}
        />
        <Button disabled={isPending} type="submit">
          Set Password
        </Button>
      </Stack>
    </form>
  )
}

/**
 * Password form for changing an existing password.
 * Uses @mantine/form with uncontrolled mode for React 19 compatibility.
 */
function ChangePasswordForm({
  isPending,
  onSuccess,
  onError,
}: {
  isPending: boolean
  onSuccess: (message: string) => void
  onError: (message: string) => void
}) {
  const [, startTransition] = useTransition()

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) =>
        value.length < 1 ? 'Current password is required' : null,
      newPassword: (value) =>
        value.length < 8 ? 'New password must be at least 8 characters' : null,
      confirmPassword: (value, values) =>
        value !== values.newPassword ? 'Passwords do not match' : null,
    },
  })

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      if (result.success) {
        onSuccess('Password changed successfully')
        form.reset()
      } else {
        onError(result.error)
      }
    })
  })

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <PasswordInput
          disabled={isPending}
          label="Current Password"
          {...form.getInputProps('currentPassword')}
        />
        <PasswordInput
          disabled={isPending}
          label="New Password"
          {...form.getInputProps('newPassword')}
        />
        <PasswordInput
          disabled={isPending}
          label="Confirm New Password"
          {...form.getInputProps('confirmPassword')}
        />
        <Button disabled={isPending} type="submit">
          Change Password
        </Button>
      </Stack>
    </form>
  )
}

/**
 * Account settings client component.
 * Displays linked login methods and password management.
 */
export function AccountContent({ linkedAccounts }: AccountContentProps) {
  usePageTitle('Account')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Unlink confirmation modal
  const [
    unlinkModalOpened,
    { open: openUnlinkModal, close: closeUnlinkModal },
  ] = useDisclosure(false)
  const [providerToUnlink, setProviderToUnlink] = useState<string | null>(null)

  const isProviderLinked = (provider: string) =>
    linkedAccounts.providers.some((p) => p.provider === provider)

  const handleUnlinkClick = (provider: string) => {
    setProviderToUnlink(provider)
    openUnlinkModal()
  }

  const handleUnlinkConfirm = () => {
    if (!providerToUnlink) return
    startTransition(async () => {
      const result = await unlinkProvider(providerToUnlink)
      if (result.success) {
        setFeedback({
          type: 'success',
          message: 'Provider unlinked successfully',
        })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
      closeUnlinkModal()
      setProviderToUnlink(null)
      router.refresh()
    })
  }

  const handleLinkOAuth = (provider: string) => {
    window.location.href = `/api/auth/link/${provider}`
  }

  return (
    <Container py="xl" size="sm">
      <Stack gap="xl">
        <Suspense fallback={null}>
          <LinkFeedback />
        </Suspense>

        {feedback && (
          <Paper
            bg={feedback.type === 'success' ? 'teal.0' : 'red.0'}
            p="sm"
            radius="sm"
          >
            <Text
              c={feedback.type === 'success' ? 'teal.8' : 'red.8'}
              size="sm"
            >
              {feedback.message}
            </Text>
          </Paper>
        )}

        {/* Linked Login Methods */}
        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            <Title order={4}>Linked Login Methods</Title>

            {Object.entries(PROVIDER_CONFIG).map(
              ([provider, { label, icon: Icon, color }]) => {
                const linked = isProviderLinked(provider)
                return (
                  <Group justify="space-between" key={provider}>
                    <Group>
                      <Icon size={24} stroke={1.5} />
                      <Text>{label}</Text>
                      <Badge
                        color={linked ? 'green' : 'gray'}
                        size="sm"
                        variant="light"
                      >
                        {linked ? 'Linked' : 'Not linked'}
                      </Badge>
                    </Group>
                    {linked ? (
                      <Button
                        color="red"
                        disabled={isPending}
                        leftSection={<IconLinkOff size={16} />}
                        onClick={() => handleUnlinkClick(provider)}
                        size="compact-sm"
                        variant="light"
                      >
                        Unlink
                      </Button>
                    ) : (
                      <Button
                        color={color}
                        disabled={isPending}
                        leftSection={<IconLink size={16} />}
                        onClick={() => handleLinkOAuth(provider)}
                        size="compact-sm"
                        variant="light"
                      >
                        Link
                      </Button>
                    )}
                  </Group>
                )
              },
            )}

            {/* Email/Password row */}
            <Group justify="space-between">
              <Group>
                <IconMail size={24} stroke={1.5} />
                <Text>Email / Password</Text>
                <Badge
                  color={linkedAccounts.hasPassword ? 'green' : 'gray'}
                  size="sm"
                  variant="light"
                >
                  {linkedAccounts.hasPassword ? 'Set' : 'Not set'}
                </Badge>
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* Password Management */}
        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <Stack gap="md">
            <Group>
              <IconLock size={20} stroke={1.5} />
              <Title order={4}>
                {linkedAccounts.hasPassword
                  ? 'Change Password'
                  : 'Set Password'}
              </Title>
            </Group>

            <Text c="dimmed" size="sm">
              Login email: {linkedAccounts.email}
            </Text>

            {linkedAccounts.hasPassword ? (
              <ChangePasswordForm
                isPending={isPending}
                onError={(msg) => setFeedback({ type: 'error', message: msg })}
                onSuccess={(msg) => {
                  setFeedback({ type: 'success', message: msg })
                }}
              />
            ) : (
              <SetPasswordForm
                email={linkedAccounts.email}
                isPending={isPending}
                onError={(msg) => setFeedback({ type: 'error', message: msg })}
                onSuccess={(msg) => {
                  setFeedback({ type: 'success', message: msg })
                  router.refresh()
                }}
              />
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Unlink Confirmation Modal */}
      <Modal
        centered
        onClose={closeUnlinkModal}
        opened={unlinkModalOpened}
        title="Unlink Provider"
      >
        <Stack>
          <Text>
            Are you sure you want to unlink{' '}
            {providerToUnlink &&
              PROVIDER_CONFIG[providerToUnlink as keyof typeof PROVIDER_CONFIG]
                ?.label}
            ? You will no longer be able to sign in with this provider.
          </Text>
          <Group justify="flex-end">
            <Button onClick={closeUnlinkModal} variant="default">
              Cancel
            </Button>
            <Button
              color="red"
              loading={isPending}
              onClick={handleUnlinkConfirm}
            >
              Unlink
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
