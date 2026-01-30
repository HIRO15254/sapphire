'use client'

import {
  Burger,
  Button,
  Divider,
  Group,
  AppShell as MantineAppShell,
  NavLink,
  ScrollArea,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBuildingStore,
  IconCards,
  IconChartBar,
  IconCoin,
  IconHelp,
  IconHome,
  IconLogout,
  IconPlayerPause,
  IconPlayerPlay,
  IconUsers,
} from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { SignOutButton } from '~/components/auth/SignOutButton'
import { ThemeToggle } from '~/components/ui/ThemeToggle'
import { usePageTitleValue } from '~/contexts/PageTitleContext'
import { api } from '~/trpc/react'

interface AppShellProps {
  children: ReactNode
}

/**
 * Navigation items for the app.
 */
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: IconHome },
  { href: '/sessions', label: 'Sessions', icon: IconCards },
  { href: '/currencies', label: 'Currencies', icon: IconCoin },
  { href: '/stores', label: 'Stores', icon: IconBuildingStore },
  { href: '/players', label: 'Players', icon: IconUsers },
  { href: '/statistics', label: 'Statistics', icon: IconChartBar },
  { href: '/help', label: 'Help', icon: IconHelp },
]

/**
 * Main application shell with navigation.
 * Provides responsive sidebar navigation and header.
 */
export function AppShell({ children }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure()
  const pathname = usePathname()
  const pageTitle = usePageTitleValue()

  // Query active session for header indicator
  const { data: activeSession } = api.sessionEvent.getActiveSession.useQuery(
    undefined,
    {
      refetchInterval: 60000, // Check every minute
      retry: false,
    },
  )

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={{ base: 'xs', sm: 'md' }}
    >
      <MantineAppShell.Header>
        <Group h="100%" justify="space-between" px="md" wrap="nowrap">
          <Group style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Burger
              aria-label="Open menu"
              hiddenFrom="sm"
              onClick={toggle}
              opened={opened}
              size="sm"
            />
            <Title
              order={3}
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {pageTitle || 'Sapphire'}
            </Title>
          </Group>
          <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Active Session Indicator / Start Session Button */}
            {activeSession ? (
              <Tooltip
                label={
                  activeSession.isPaused
                    ? 'Show paused session'
                    : 'Show active session'
                }
              >
                <Button
                  color={activeSession.isPaused ? 'gray' : 'red'}
                  component={Link}
                  href="/sessions/active"
                  leftSection={
                    activeSession.isPaused ? (
                      <IconPlayerPause size={16} />
                    ) : (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          animation: 'pulse 1.5s infinite',
                        }}
                      />
                    )
                  }
                  size="compact-sm"
                  variant="filled"
                >
                  {activeSession.isPaused ? 'Paused' : 'LIVE'}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip label="Start Live Session">
                <Button
                  color="gray"
                  component={Link}
                  href="/sessions/active"
                  leftSection={<IconPlayerPlay size={16} />}
                  size="compact-sm"
                  variant="light"
                >
                  Session
                </Button>
              </Tooltip>
            )}
            {/* CSS for pulse animation */}
            <style>
              {`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.4; }
                }
              `}
            </style>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <MantineAppShell.Section component={ScrollArea} grow>
          {navItems.map((item) => (
            <NavLink
              active={
                pathname === item.href || pathname?.startsWith(`${item.href}/`)
              }
              component={Link}
              href={item.href}
              key={item.href}
              label={item.label}
              leftSection={<item.icon size={20} stroke={1.5} />}
              onClick={toggle}
            />
          ))}
        </MantineAppShell.Section>

        <MantineAppShell.Section>
          <Divider my="sm" />
          <Group justify="space-between">
            <SignOutButton
              justify="flex-start"
              leftSection={<IconLogout size={20} stroke={1.5} />}
              variant="subtle"
            >
              ログアウト
            </SignOutButton>
            <ThemeToggle />
          </Group>
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  )
}
