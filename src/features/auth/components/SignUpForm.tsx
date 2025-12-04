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
import { IconBrandGithub, IconBrandGoogle, IconMail, IconUser } from "@tabler/icons-react";

export interface SignUpFormProps {
  email: string;
  password: string;
  name: string;
  error: string | null;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onGitHubSignIn: () => void;
}

export function SignUpForm({
  email,
  password,
  name,
  error,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onSubmit,
  onGoogleSignIn,
  onGitHubSignIn,
}: SignUpFormProps) {
  return (
    <Stack gap="lg">
      <Stack gap="xs" align="center">
        <Title order={2}>アカウント作成</Title>
        <Text size="sm" c="dimmed">
          新しいアカウントを作成してください
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
          Googleで登録
        </Button>
        <Button
          variant="default"
          leftSection={<IconBrandGithub size={18} />}
          onClick={onGitHubSignIn}
          disabled={isLoading}
          fullWidth
        >
          GitHubで登録
        </Button>
      </Stack>

      <Divider label="または" labelPosition="center" />

      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <TextInput
            label="表示名"
            placeholder="お名前"
            leftSection={<IconUser size={16} />}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={isLoading}
            autoComplete="name"
          />
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
            placeholder="8文字以上"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="new-password"
            description="8文字以上で入力してください"
          />

          {error && (
            <Text c="red" size="sm" ta="center">
              {error}
            </Text>
          )}

          <Button type="submit" loading={isLoading} fullWidth>
            アカウントを作成
          </Button>
        </Stack>
      </form>

      <Text ta="center" size="sm">
        すでにアカウントをお持ちですか？{" "}
        <Anchor href="/auth/signin" underline="hover">
          ログイン
        </Anchor>
      </Text>
    </Stack>
  );
}
