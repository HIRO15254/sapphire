"use client";

import {
  Anchor,
  Button,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconBrandGithub, IconBrandGoogle, IconMail } from "@tabler/icons-react";

export interface SignInFormProps {
  email: string;
  password: string;
  error: string | null;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onGitHubSignIn: () => void;
}

export function SignInForm({
  email,
  password,
  error,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleSignIn,
  onGitHubSignIn,
}: SignInFormProps) {
  return (
    <Stack gap="lg">
      <Stack gap="xs" align="center">
        <Title order={2}>ログイン</Title>
        <Text size="sm" c="dimmed">
          アカウントにログインしてください
        </Text>
      </Stack>

      <Stack gap="sm">
        <Button
          variant="default"
          leftSection={<IconBrandGoogle size={18} />}
          onClick={onGoogleSignIn}
          disabled={isLoading}
          fullWidth
        >
          Googleでログイン
        </Button>
        <Button
          variant="default"
          leftSection={<IconBrandGithub size={18} />}
          onClick={onGitHubSignIn}
          disabled={isLoading}
          fullWidth
        >
          GitHubでログイン
        </Button>
      </Stack>

      <Divider label="または" labelPosition="center" />

      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <TextInput
            label="メールアドレス"
            placeholder="your@email.com"
            leftSection={<IconMail size={16} />}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            disabled={isLoading}
            type="email"
            autoComplete="email"
          />
          <PasswordInput
            label="パスワード"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password"
          />

          {error && (
            <Text c="red" size="sm" ta="center">
              {error}
            </Text>
          )}

          <Button type="submit" loading={isLoading} fullWidth>
            ログイン
          </Button>
        </Stack>
      </form>

      <Text ta="center" size="sm">
        アカウントをお持ちでないですか？{" "}
        <Anchor href="/auth/signup" underline="hover">
          新規登録
        </Anchor>
      </Text>
    </Stack>
  );
}
