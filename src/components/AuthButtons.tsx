"use client";

import { Button, Group, Menu, Stack, Text } from "@mantine/core";
import { IconChartLine, IconLogin, IconLogout } from "@tabler/icons-react";
import Link from "next/link";
import { useTransition } from "react";

import { signIn, signOut } from "@/app/actions/auth";

interface AuthButtonsProps {
  isAuthenticated: boolean;
}

export function AuthButtons({ isAuthenticated }: AuthButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignIn = (provider: "google" | "github") => {
    startTransition(async () => {
      await signIn(provider);
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  if (isAuthenticated) {
    return (
      <Group gap="md">
        <Button
          component={Link}
          href="/poker-sessions"
          size="lg"
          leftSection={<IconChartLine size={20} />}
        >
          セッション管理
        </Button>
        <Button
          size="lg"
          variant="outline"
          leftSection={<IconLogout size={20} />}
          onClick={handleSignOut}
          loading={isPending}
        >
          ログアウト
        </Button>
      </Group>
    );
  }

  return (
    <Stack gap="md" align="center">
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button size="lg" leftSection={<IconLogin size={20} />} loading={isPending}>
            ログイン
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>アカウントを選択</Menu.Label>
          <Menu.Item onClick={() => handleSignIn("google")}>Google</Menu.Item>
          <Menu.Item onClick={() => handleSignIn("github")}>GitHub</Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Text size="sm" c="dimmed" ta="center">
        Googleアカウント または GitHubアカウント でサインイン
      </Text>
    </Stack>
  );
}
