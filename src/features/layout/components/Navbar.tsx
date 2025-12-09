"use client";

import { Box, Divider, NavLink, Stack, Text } from "@mantine/core";
import { IconBuilding, IconCoins, IconHome, IconList, IconLogout } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  /** ユーザー名 */
  userName?: string;
  /** ユーザーメールアドレス */
  userEmail?: string;
  /** ログアウトのコールバック */
  onLogout?: () => void;
  /** ナビゲーションリンククリック時のコールバック（モバイル用） */
  onNavigate?: () => void;
}

const navigationLinks = [
  { href: "/", label: "ダッシュボード", icon: IconHome },
  { href: "/poker-sessions", label: "セッション一覧", icon: IconList },
  { href: "/locations", label: "店舗管理", icon: IconBuilding },
  { href: "/settings/currencies", label: "通貨管理", icon: IconCoins },
];

/**
 * サイドバーナビゲーションのPresentationコンポーネント
 *
 * FR-001: デスクトップでは常に展開表示、モバイルではハンバーガーメニュー
 * FR-002: ダッシュボード、セッション一覧へのリンクを含む
 * FR-003: 現在のページを視覚的にハイライト表示
 */
export function Navbar({ userName, userEmail, onLogout, onNavigate }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <Stack h="100%" justify="space-between" p="md">
      {/* ナビゲーションリンク */}
      <Stack gap="xs">
        {navigationLinks.map((link) => (
          <NavLink
            key={link.href}
            component={Link}
            href={link.href}
            label={link.label}
            leftSection={<link.icon size={20} stroke={1.5} />}
            active={isActive(link.href)}
            onClick={handleNavClick}
            style={{
              borderRadius: "var(--mantine-radius-md)",
            }}
          />
        ))}
      </Stack>

      {/* フッター: ユーザー情報とログアウト */}
      <Stack gap="xs">
        <Divider />

        {/* ユーザー情報 */}
        {userName && (
          <Box p="xs">
            <Text size="sm" fw={500} truncate>
              {userName}
            </Text>
            {userEmail && (
              <Text size="xs" c="dimmed" truncate>
                {userEmail}
              </Text>
            )}
          </Box>
        )}

        {/* ログアウトボタン */}
        {onLogout && (
          <NavLink
            component="button"
            label="ログアウト"
            leftSection={<IconLogout size={20} stroke={1.5} />}
            onClick={onLogout}
            style={{
              borderRadius: "var(--mantine-radius-md)",
            }}
          />
        )}
      </Stack>
    </Stack>
  );
}
