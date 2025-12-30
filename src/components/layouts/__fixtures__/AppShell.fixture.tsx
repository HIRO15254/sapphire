'use client'

import {
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  AppShell as MantineAppShell,
  ScrollArea,
  Text,
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
  IconLogout,
  IconUsers,
} from '@tabler/icons-react'
import { ThemeToggle } from '~/components/ui/ThemeToggle'

/**
 * Navigation items for the fixture.
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
 * Fixture for AppShell component.
 *
 * Note: This is a simplified version without Next.js routing and auth.
 * It demonstrates the visual layout and navigation structure.
 */
function AppShellDemo() {
  const [opened, { toggle }] = useDisclosure()
  const activePath = '/dashboard'

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
            <Title order={3}>Sapphire</Title>
          </Group>
          <ThemeToggle />
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <MantineAppShell.Section component={ScrollArea} grow>
          {navItems.map((item) => (
            <NavLink
              active={activePath === item.href}
              href="#"
              key={item.href}
              label={item.label}
              leftSection={<item.icon size={20} stroke={1.5} />}
              onClick={(e) => {
                e.preventDefault()
                alert(`Navigate to: ${item.href}`)
              }}
            />
          ))}
        </MantineAppShell.Section>

        <MantineAppShell.Section>
          <Divider my="sm" />
          <Button
            fullWidth
            justify="flex-start"
            leftSection={<IconLogout size={20} stroke={1.5} />}
            onClick={() => alert('ログアウト')}
            variant="subtle"
          >
            ログアウト
          </Button>
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Text c="dimmed">
          メインコンテンツエリア。実際のアプリではここにページコンテンツが表示されます。
        </Text>
      </MantineAppShell.Main>
    </MantineAppShell>
  )
}

export default {
  Default: <AppShellDemo />,
}
