"use client";

import { Button, Group, Stack, Text } from "@mantine/core";
import { IconBrandGithub, IconBrandGoogle, IconChartLine, IconLogout } from "@tabler/icons-react";
import Link from "next/link";

import { doSignOut, signInWithGitHub, signInWithGoogle } from "@/app/actions/auth";

interface AuthButtonsProps {
  isAuthenticated: boolean;
}

export function AuthButtons({ isAuthenticated }: AuthButtonsProps) {
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
        <form action={doSignOut}>
          <Button type="submit" size="lg" variant="outline" leftSection={<IconLogout size={20} />}>
            ログアウト
          </Button>
        </form>
      </Group>
    );
  }

  return (
    <Stack gap="md" align="center">
      <Group gap="md">
        <form action={signInWithGoogle}>
          <Button type="submit" size="lg" leftSection={<IconBrandGoogle size={20} />}>
            Googleでログイン
          </Button>
        </form>
        <form action={signInWithGitHub}>
          <Button
            type="submit"
            size="lg"
            variant="outline"
            leftSection={<IconBrandGithub size={20} />}
          >
            GitHubでログイン
          </Button>
        </form>
      </Group>

      <Text size="sm" c="dimmed" ta="center">
        Googleアカウント または GitHubアカウント でサインイン
      </Text>
    </Stack>
  );
}
