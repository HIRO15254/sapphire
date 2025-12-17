'use client'

import {
  Burger,
  Group,
  AppShell as MantineAppShell,
  NavLink,
  ScrollArea,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBuildingStore,
  IconCards,
  IconChartBar,
  IconCoin,
  IconHelp,
  IconHome,
  IconUsers,
} from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { ThemeToggle } from '~/components/ui/ThemeToggle'

interface AppShellProps {
  children: ReactNode
}

/**
 * Navigation items for the app.
 */
const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: IconHome },
  { href: '/sessions', label: 'セッション', icon: IconCards },
  { href: '/currencies', label: '通貨', icon: IconCoin },
  { href: '/stores', label: '店舗', icon: IconBuildingStore },
  { href: '/players', label: 'プレイヤー', icon: IconUsers },
  { href: '/statistics', label: '統計', icon: IconChartBar },
  { href: '/help', label: 'ヘルプ', icon: IconHelp },
]

/**
 * Main application shell with navigation.
 * Provides responsive sidebar navigation and header.
 */
export function AppShell({ children }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure()
  const pathname = usePathname()

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Group>
            <Burger
              aria-label="メニューを開く"
              hiddenFrom="sm"
              onClick={toggle}
              opened={opened}
              size="sm"
            />
            <Link
              href="/dashboard"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Title order={3}>Sapphire</Title>
            </Link>
          </Group>
          <ThemeToggle />
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
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  )
}
