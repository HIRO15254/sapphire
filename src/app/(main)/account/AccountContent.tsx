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
import { useEffect, useState, useTransition } from 'react'

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
 * Account settings client component.
 * Displays linked login methods and password management.
 */
export function AccountContent({ linkedAccounts }: AccountContentProps) {
  usePageTitle('Account')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Feedback from URL params
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Unlink confirmation modal
  const [unlinkModalOpened, { open: openUnlinkModal, close: closeUnlinkModal }] =
    useDisclosure(false)
  const [providerToUnlink, setProviderToUnlink] = useState<string | null>(null)

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    password: '',
    confirmNewPassword: '',
  })

  useEffect(() => {
    const linked = searchParams.get('linked')
    const error = searchParams.get('error')
    if (linked === 'success') {
      setFeedback({ type: 'success', message: 'Account linked successfully' })
      router.replace('/account')
    } else if (error) {
      setFeedback({ type: 'error', message: `Failed to link account: ${error}` })
      router.replace('/account')
    }
  }, [searchParams, router])

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
        setFeedback({ type: 'success', message: 'Provider unlinked successfully' })
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

  const handleSetPassword = () => {
    startTransition(async () => {
      const result = await setPassword({
        password: passwordForm.password,
        confirmPassword: passwordForm.confirmNewPassword,
      })
      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Password set successfully. You can now sign in with ${linkedAccounts.email} and your password.`,
        })
        setPasswordForm((prev) => ({
          ...prev,
          password: '',
          confirmNewPassword: '',
        }))
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  const handleChangePassword = () => {
    startTransition(async () => {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      })
      if (result.success) {
        setFeedback({ type: 'success', message: 'Password changed successfully' })
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          password: '',
          confirmNewPassword: '',
        })
      } else {
        setFeedback({ type: 'error', message: result.error })
      }
    })
  }

  return (
    <Container py="xl" size="sm">
      <Stack gap="xl">
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
              <>
                <PasswordInput
                  disabled={isPending}
                  label="Current Password"
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.currentTarget.value,
                    }))
                  }
                  value={passwordForm.currentPassword}
                />
                <PasswordInput
                  disabled={isPending}
                  label="New Password"
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.currentTarget.value,
                    }))
                  }
                  value={passwordForm.newPassword}
                />
                <PasswordInput
                  disabled={isPending}
                  label="Confirm New Password"
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.currentTarget.value,
                    }))
                  }
                  value={passwordForm.confirmPassword}
                />
                <Button
                  disabled={
                    isPending ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword
                  }
                  onClick={handleChangePassword}
                >
                  Change Password
                </Button>
              </>
            ) : (
              <>
                <PasswordInput
                  disabled={isPending}
                  label="Password"
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      password: e.currentTarget.value,
                    }))
                  }
                  value={passwordForm.password}
                />
                <PasswordInput
                  disabled={isPending}
                  label="Confirm Password"
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmNewPassword: e.currentTarget.value,
                    }))
                  }
                  value={passwordForm.confirmNewPassword}
                />
                <Button
                  disabled={
                    isPending ||
                    !passwordForm.password ||
                    !passwordForm.confirmNewPassword
                  }
                  onClick={handleSetPassword}
                >
                  Set Password
                </Button>
              </>
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
              PROVIDER_CONFIG[
                providerToUnlink as keyof typeof PROVIDER_CONFIG
              ]?.label}
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
