# Mantineベース レスポンシブレイアウト コンポーネント設計

## Mantineコンポーネント階層

```
ResponsiveLayout (MantineProvider + AppShell統合)
├── MantineProvider (テーマ・設定プロバイダー)
├── NavigationProvider (ナビゲーション状態管理)
├── AppShell (レイアウトコンテナ)
│   ├── AppShell.Header (ヘッダー領域)
│   │   ├── Group (ヘッダーコンテンツ配置)
│   │   ├── Burger (ハンバーガーメニュートリガー)
│   │   └── NavLink[] (デスクトップナビゲーション)
│   ├── AppShell.Navbar (サイドバー - デスクトップのみ)
│   │   ├── ScrollArea (スクロール対応)
│   │   └── NavLink[] (サイドナビゲーション)
│   ├── AppShell.Footer (フッター - モバイルのみ)
│   │   └── Group (フッターナビゲーション)
│   └── AppShell.Main (メインコンテンツ)
└── Drawer (ハンバーガーメニュー - モバイルのみ)
    ├── Stack (縦並びレイアウト)
    └── NavLink[] (モバイルナビゲーション)
```

## 主要コンポーネント詳細設計

### 1. ResponsiveLayout (最上位コンポーネント)

```typescript
import {
  MantineProvider,
  AppShell,
  useMediaQuery,
  createTheme,
  MantineColorsTuple
} from '@mantine/core';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  navigationConfig: NavigationConfig;
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  navigationConfig,
  theme = 'auto',
  primaryColor = 'blue',
}) => {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [hamburgerOpened, setHamburgerOpened] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const mantineTheme = createTheme({
    primaryColor,
    defaultRadius: 'md',
    breakpoints: {
      xs: '36em',
      sm: '48em',
      md: '62em',
      lg: '75em',
      xl: '88em',
    },
    components: {
      AppShell: AppShell.extend({
        defaultProps: {
          transitionDuration: 200,
          transitionTimingFunction: 'ease-out',
        },
      }),
    },
  });

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme={theme}>
      <NavigationProvider config={navigationConfig}>
        <AppShell
          header={{ height: { base: 56, md: 64 } }}
          navbar={{
            width: { base: 0, md: sidebarCollapsed ? 80 : 280 },
            breakpoint: 'md',
            collapsed: { mobile: true, desktop: false },
          }}
          footer={{
            height: { base: 80, md: 0 },
            collapsed: { mobile: false, desktop: true },
          }}
          padding={{ base: 'sm', md: 'md' }}
        >
          {/* ヘッダー */}
          <AppShell.Header>
            <HeaderNavigation
              items={navigationConfig.primary}
              isMobile={isMobile}
              hamburgerOpened={hamburgerOpened}
              onHamburgerToggle={() => setHamburgerOpened(!hamburgerOpened)}
            />
          </AppShell.Header>

          {/* デスクトップサイドバー */}
          {!isMobile && (
            <AppShell.Navbar>
              <SideNavigation
                items={navigationConfig.secondary}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </AppShell.Navbar>
          )}

          {/* モバイルフッター */}
          {isMobile && (
            <AppShell.Footer>
              <FooterNavigation items={navigationConfig.primary} />
            </AppShell.Footer>
          )}

          {/* メインコンテンツ */}
          <AppShell.Main>{children}</AppShell.Main>

          {/* モバイルハンバーガーメニュー */}
          <HamburgerMenu
            items={navigationConfig.secondary}
            opened={hamburgerOpened}
            onClose={() => setHamburgerOpened(false)}
          />
        </AppShell>
      </NavigationProvider>
    </MantineProvider>
  );
};
```

### 2. HeaderNavigation (Mantineヘッダー)

```typescript
import {
  Group,
  Burger,
  Text,
  NavLink,
  ActionIcon,
  Menu,
  rem,
  useMantineColorScheme,
} from '@mantine/core';
import { IconSun, IconMoon, IconBrandLogo } from '@tabler/icons-react';

interface HeaderNavigationProps {
  items: NavigationItem[];
  isMobile: boolean;
  hamburgerOpened: boolean;
  onHamburgerToggle: () => void;
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  items,
  isMobile,
  hamburgerOpened,
  onHamburgerToggle,
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const { currentRoute } = useNavigation();

  return (
    <Group h="100%" px="md" justify="space-between">
      {/* 左側: ロゴ + ハンバーガー(モバイル) */}
      <Group>
        {isMobile && (
          <Burger
            opened={hamburgerOpened}
            onClick={onHamburgerToggle}
            size="sm"
            aria-label="ナビゲーションメニューを開く"
          />
        )}

        <Group gap="xs">
          <IconBrandLogo size={28} />
          <Text size="lg" fw={600}>
            アプリ名
          </Text>
        </Group>
      </Group>

      {/* 中央: デスクトップナビゲーション */}
      {!isMobile && (
        <Group gap="xs">
          {items.slice(0, 5).map((item) => (
            <NavLink
              key={item.id}
              label={item.label}
              active={currentRoute === item.path}
              onClick={() => navigate(item.path)}
              leftSection={item.icon && <item.icon size={rem(16)} />}
              variant="subtle"
              styles={{
                root: {
                  borderRadius: 'var(--mantine-radius-md)',
                  padding: `${rem(8)} ${rem(12)}`,
                },
              }}
            />
          ))}

          {/* オーバーフロー時のメニュー */}
          {items.length > 5 && (
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg">
                  <IconDots size={rem(16)} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {items.slice(5).map((item) => (
                  <Menu.Item
                    key={item.id}
                    leftSection={item.icon && <item.icon size={rem(14)} />}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      )}

      {/* 右側: テーマ切り替え */}
      <ActionIcon
        variant="subtle"
        onClick={() => toggleColorScheme()}
        size="lg"
        aria-label="テーマを切り替える"
      >
        {colorScheme === 'dark' ? (
          <IconSun size={rem(18)} />
        ) : (
          <IconMoon size={rem(18)} />
        )}
      </ActionIcon>
    </Group>
  );
};
```

### 3. SideNavigation (Mantineサイドバー)

```typescript
import {
  NavLink,
  ScrollArea,
  Divider,
  Text,
  ActionIcon,
  Tooltip,
  Stack,
  rem,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface SideNavigationProps {
  items: NavigationItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SideNavigation: React.FC<SideNavigationProps> = ({
  items,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const { currentRoute } = useNavigation();

  // 項目をグループ化
  const groupedItems = items.reduce((acc, item) => {
    const group = item.group || 'default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  return (
    <Stack h="100%" gap={0}>
      {/* ヘッダー */}
      <Group p="md" justify="space-between">
        {!isCollapsed && (
          <Text size="sm" fw={500} c="dimmed">
            メニュー
          </Text>
        )}
        <ActionIcon
          variant="subtle"
          onClick={onToggleCollapse}
          size="sm"
          aria-label={isCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
        >
          {isCollapsed ? (
            <IconChevronRight size={rem(16)} />
          ) : (
            <IconChevronLeft size={rem(16)} />
          )}
        </ActionIcon>
      </Group>

      <Divider />

      {/* ナビゲーションコンテンツ */}
      <ScrollArea flex={1} type="scroll">
        <Stack gap="xs" p="md">
          {Object.entries(groupedItems).map(([groupName, groupItems]) => (
            <div key={groupName}>
              {!isCollapsed && groupName !== 'default' && (
                <Text size="xs" tt="uppercase" fw={700} c="dimmed" pl="sm" pb="xs">
                  {groupName}
                </Text>
              )}

              <Stack gap="xs">
                {groupItems.map((item) => {
                  const NavComponent = (
                    <NavLink
                      key={item.id}
                      label={!isCollapsed ? item.label : undefined}
                      active={currentRoute === item.path}
                      onClick={() => navigate(item.path)}
                      leftSection={
                        item.icon && (
                          <item.icon size={rem(16)} stroke={1.5} />
                        )
                      }
                      rightSection={
                        !isCollapsed && item.badge ? (
                          <Badge size="xs" variant="filled">
                            {item.badge}
                          </Badge>
                        ) : undefined
                      }
                      variant="subtle"
                      styles={{
                        root: {
                          borderRadius: 'var(--mantine-radius-md)',
                        },
                        label: {
                          fontSize: rem(14),
                        },
                      }}
                    />
                  );

                  // 折りたたみ時はツールチップで表示
                  return isCollapsed ? (
                    <Tooltip
                      key={item.id}
                      label={item.label}
                      position="right"
                      offset={10}
                    >
                      {NavComponent}
                    </Tooltip>
                  ) : (
                    NavComponent
                  );
                })}
              </Stack>
            </div>
          ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};
```

### 4. FooterNavigation (Mantineフッター)

```typescript
import {
  Group,
  UnstyledButton,
  Text,
  Center,
  Box,
  Indicator,
  rem,
} from '@mantine/core';

interface FooterNavigationProps {
  items: NavigationItem[];
}

const FooterNavigation: React.FC<FooterNavigationProps> = ({ items }) => {
  const navigate = useNavigate();
  const { currentRoute } = useNavigation();

  return (
    <Group
      justify="space-around"
      h="100%"
      px="sm"
      style={{
        borderTop: '1px solid var(--mantine-color-gray-3)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.slice(0, 5).map((item) => {
        const isActive = currentRoute === item.path;

        return (
          <UnstyledButton
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              padding: rem(8),
              borderRadius: 'var(--mantine-radius-md)',
              transition: 'all 150ms ease',
              minHeight: rem(44), // タップエリア確保
            }}
            data-active={isActive}
            aria-label={item.label}
            __vars={{
              '--button-bg': isActive
                ? 'var(--mantine-color-blue-light)'
                : 'transparent',
              '--button-color': isActive
                ? 'var(--mantine-color-blue-filled)'
                : 'var(--mantine-color-gray-6)',
            }}
            styles={{
              root: {
                backgroundColor: 'var(--button-bg)',
                color: 'var(--button-color)',
                '&:hover': {
                  backgroundColor: isActive
                    ? 'var(--mantine-color-blue-light-hover)'
                    : 'var(--mantine-color-gray-0)',
                },
              },
            }}
          >
            <Indicator
              disabled={!item.hasNotification}
              size={8}
              color="red"
              offset={4}
            >
              <Center>
                <Box>
                  {item.icon && (
                    <Center mb="xs">
                      <item.icon size={rem(20)} stroke={1.5} />
                    </Center>
                  )}
                  <Text size="xs" ta="center" fw={isActive ? 500 : 400}>
                    {item.label}
                  </Text>
                </Box>
              </Center>
            </Indicator>
          </UnstyledButton>
        );
      })}
    </Group>
  );
};
```

### 5. HamburgerMenu (Mantineドロワー)

```typescript
import {
  Drawer,
  NavLink,
  Stack,
  Divider,
  Text,
  Group,
  ActionIcon,
  ScrollArea,
  rem,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';

interface HamburgerMenuProps {
  items: NavigationItem[];
  opened: boolean;
  onClose: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  items,
  opened,
  onClose,
}) => {
  const navigate = useNavigate();
  const { currentRoute } = useNavigation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  // 項目をグループ化
  const groupedItems = items.reduce((acc, item) => {
    const group = item.group || 'その他';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="left"
      size="85%"
      styles={{
        content: {
          maxWidth: rem(320),
        },
      }}
      overlayProps={{
        backgroundOpacity: 0.5,
        blur: 3,
      }}
      transitionProps={{
        transition: 'slide-right',
        duration: 200,
        timingFunction: 'ease-out',
      }}
      title={
        <Group justify="space-between" w="100%">
          <Text size="lg" fw={600}>
            メニュー
          </Text>
        </Group>
      }
      closeButtonProps={{
        'aria-label': 'メニューを閉じる',
      }}
      trapFocus
      returnFocus
    >
      <Stack gap="md" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ScrollArea h="calc(100vh - 120px)" type="scroll">
          <Stack gap="lg">
            {Object.entries(groupedItems).map(([groupName, groupItems]) => (
              <div key={groupName}>
                <Text size="sm" fw={500} c="dimmed" mb="xs" px="sm">
                  {groupName}
                </Text>

                <Stack gap="xs">
                  {groupItems.map((item) => (
                    <NavLink
                      key={item.id}
                      label={item.label}
                      description={item.description}
                      active={currentRoute === item.path}
                      onClick={() => handleNavigation(item.path)}
                      leftSection={
                        item.icon && (
                          <item.icon size={rem(20)} stroke={1.5} />
                        )
                      }
                      rightSection={
                        item.badge ? (
                          <Badge size="sm" variant="filled" color="red">
                            {item.badge}
                          </Badge>
                        ) : undefined
                      }
                      variant="subtle"
                      styles={{
                        root: {
                          borderRadius: 'var(--mantine-radius-md)',
                          padding: `${rem(12)} ${rem(16)}`,
                          minHeight: rem(44), // タップエリア確保
                        },
                        label: {
                          fontSize: rem(16),
                        },
                        description: {
                          fontSize: rem(12),
                        },
                      }}
                    />
                  ))}
                </Stack>

                {groupName !== Object.keys(groupedItems)[Object.keys(groupedItems).length - 1] && (
                  <Divider my="md" />
                )}
              </div>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>
    </Drawer>
  );
};
```

## Mantineカスタムテーマ設定

```typescript
import { createTheme, MantineColorsTuple, rem } from '@mantine/core';

// カスタムカラーパレット
const primaryColor: MantineColorsTuple = [
  '#e3f2fd',
  '#bbdefb',
  '#90caf9',
  '#64b5f6',
  '#42a5f5',
  '#2196f3', // メインカラー
  '#1e88e5',
  '#1976d2',
  '#1565c0',
  '#0d47a1'
];

export const appTheme = createTheme({
  primaryColor: 'primary',
  colors: {
    primary: primaryColor,
  },

  defaultRadius: 'md',
  cursorType: 'pointer',

  fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif',
  fontFamilyMonospace: 'ui-monospace, "SF Mono", "Monaco", monospace',

  headings: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif',
    fontWeight: '600',
  },

  breakpoints: {
    xs: '36em',  // 576px
    sm: '48em',  // 768px - メインブレークポイント
    md: '62em',  // 992px
    lg: '75em',  // 1200px
    xl: '88em',  // 1408px
  },

  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },

  // コンポーネント固有設定
  components: {
    AppShell: AppShell.extend({
      defaultProps: {
        transitionDuration: 200,
        transitionTimingFunction: 'ease-out',
      },
    }),

    NavLink: NavLink.extend({
      defaultProps: {
        variant: 'subtle',
      },
      styles: {
        root: {
          borderRadius: 'var(--mantine-radius-md)',
          transition: 'all 150ms ease',
        },
      },
    }),

    Drawer: Drawer.extend({
      defaultProps: {
        transitionProps: {
          transition: 'slide-right',
          duration: 200,
          timingFunction: 'ease-out',
        },
        overlayProps: {
          backgroundOpacity: 0.5,
          blur: 3,
        },
      },
    }),

    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'subtle',
      },
    }),
  },

  // レスポンシブフォントサイズ
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },

  // アクセシビリティ設定
  focusRing: 'auto',
  activeClassName: 'mantine-active',

  // ダークテーマサポート
  other: {
    // カスタムCSS変数
    headerHeight: {
      mobile: rem(56),
      desktop: rem(64),
    },
    footerHeight: rem(80),
    sidebarWidth: {
      expanded: rem(280),
      collapsed: rem(80),
    },
  },
});
```

## Mantineフック活用

```typescript
// レスポンシブ状態管理
export const useResponsiveLayout = () => {
  const isMobile = useMediaQuery('(max-width: 48em)');
  const isTablet = useMediaQuery('(min-width: 48em) and (max-width: 62em)');
  const isDesktop = useMediaQuery('(min-width: 62em)');

  return { isMobile, isTablet, isDesktop };
};

// テーマ状態管理
export const useAppTheme = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  return { colorScheme: computedColorScheme, toggleColorScheme };
};

// ナビゲーション状態管理
export const useAppNavigation = () => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return {
    hamburgerOpened: opened,
    toggleHamburger: toggle,
    closeHamburger: close,
    sidebarCollapsed,
    toggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
  };
};
```