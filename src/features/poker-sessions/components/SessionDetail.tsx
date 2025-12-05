"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Badge, Button, Card, Divider, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft, IconEdit, IconTrash } from "@tabler/icons-react";
import Link from "next/link";

interface SessionDetailProps {
  session: {
    id: number;
    date: Date;
    location: {
      id: number;
      name: string;
    };
    buyIn: string;
    cashOut: string;
    durationMinutes: number;
    profit: number;
    notes: string | null;
    tags: Array<{
      id: number;
      name: string;
    }>;
  };
  /** 削除ボタンクリック時のコールバック */
  onDelete?: (id: number) => void;
  /** 削除中かどうか */
  isDeleting?: boolean;
}

/**
 * セッション詳細表示コンポーネント
 *
 * 責務:
 * - セッションの詳細情報の表示
 * - 編集・削除のアクションボタン提供
 * - 収支の色分け表示
 */
export function SessionDetail({ session, onDelete, isDeleting = false }: SessionDetailProps) {
  const profitColor = session.profit > 0 ? "green" : session.profit < 0 ? "red" : "gray";
  const profitSign = session.profit > 0 ? "+" : "";

  return (
    <Stack gap="lg">
      {/* ヘッダー */}
      <Group justify="space-between" align="center">
        <Button
          component={Link}
          href="/poker-sessions"
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
        >
          一覧に戻る
        </Button>
        <Group gap="sm">
          <Button
            component={Link}
            href={`/poker-sessions/${session.id}/edit`}
            variant="light"
            leftSection={<IconEdit size={18} />}
          >
            編集
          </Button>
          {onDelete && (
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={18} />}
              onClick={() => onDelete(session.id)}
              loading={isDeleting}
            >
              削除
            </Button>
          )}
        </Group>
      </Group>

      {/* メインカード */}
      <Card withBorder p="lg">
        <Stack gap="md">
          {/* 日時と場所 */}
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                日時
              </Text>
              <Title order={3}>{formatDate(session.date)}</Title>
            </Stack>
            <Stack gap={4} align="flex-end">
              <Text size="sm" c="dimmed">
                場所
              </Text>
              <Text fw={500} size="lg">
                {session.location.name}
              </Text>
            </Stack>
          </Group>

          <Divider />

          {/* 金額情報 */}
          <Grid gutter="md">
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  バイイン
                </Text>
                <Text fw={500}>{formatCurrency(Number.parseFloat(session.buyIn))}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  キャッシュアウト
                </Text>
                <Text fw={500}>{formatCurrency(Number.parseFloat(session.cashOut))}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  収支
                </Text>
                <Text
                  fw={700}
                  c={profitColor}
                  style={{ color: `var(--mantine-color-${profitColor}-6)` }}
                >
                  {profitSign}
                  {formatCurrency(session.profit)}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  プレイ時間
                </Text>
                <Text fw={500}>{formatDuration(session.durationMinutes)}</Text>
              </Stack>
            </Grid.Col>
          </Grid>

          {/* タグ */}
          {session.tags.length > 0 && (
            <>
              <Divider />
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  タグ
                </Text>
                <Group gap="xs">
                  {session.tags.map((tag) => (
                    <Badge key={tag.id} variant="light">
                      {tag.name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </>
          )}

          {/* メモ */}
          {session.notes && (
            <>
              <Divider />
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  メモ
                </Text>
                <div
                  className="prose prose-sm max-w-none"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: HTMLコンテンツを安全に表示
                  dangerouslySetInnerHTML={{ __html: session.notes }}
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    fontSize: "0.875rem",
                  }}
                />
              </Stack>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
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
