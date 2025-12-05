"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Badge, Card, Group, Stack, Text, Title, UnstyledButton } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

interface Session {
  id: number;
  date: Date;
  location: {
    id: number;
    name: string;
  };
  profit: number;
  durationMinutes: number;
}

interface RecentSessionsProps {
  /** セッション一覧 */
  sessions: Session[];
  /** 表示する最大件数（デフォルト: 5） */
  maxCount?: number;
}

/**
 * 最近のセッション一覧コンポーネント
 *
 * 責務:
 * - 最近のセッションをリスト表示
 * - 各セッションへのリンク
 * - 収支の色分け表示
 * - セッションがない場合の空状態表示
 */
export function RecentSessions({ sessions, maxCount = 5 }: RecentSessionsProps) {
  const displaySessions = sessions.slice(0, maxCount);

  return (
    <Card withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={4}>最近のセッション</Title>
          <Link href="/poker-sessions" style={{ textDecoration: "none" }}>
            <Group gap={4} c="blue">
              <Text size="sm">すべて見る</Text>
              <IconArrowRight size={16} />
            </Group>
          </Link>
        </Group>

        {displaySessions.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            最近のセッションはありません
          </Text>
        ) : (
          <Stack gap="xs">
            {displaySessions.map((session) => (
              <SessionItem key={session.id} session={session} />
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

interface SessionItemProps {
  session: Session;
}

function SessionItem({ session }: SessionItemProps) {
  const profitColor = session.profit > 0 ? "green" : session.profit < 0 ? "red" : "gray";
  const profitSign = session.profit > 0 ? "+" : "";

  return (
    <UnstyledButton
      component={Link}
      href={`/poker-sessions/${session.id}`}
      style={{ display: "block" }}
    >
      <Card withBorder p="sm" radius="sm" style={{ cursor: "pointer" }}>
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text fw={500} size="sm">
              {session.location.name}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDate(session.date)} · {formatDuration(session.durationMinutes)}
            </Text>
          </Stack>
          <Badge color={profitColor} variant="filled" data-color={profitColor}>
            {profitSign}
            {formatCurrency(session.profit)}
          </Badge>
        </Group>
      </Card>
    </UnstyledButton>
  );
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * 分を時間と分のフォーマットに変換
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}時間${mins}分`;
  }
  if (hours > 0) {
    return `${hours}時間`;
  }
  return `${mins}分`;
}
