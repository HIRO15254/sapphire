"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Badge, Button, Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import Link from "next/link";

interface SessionDetailPageProps {
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
  };
}

export function SessionDetailPage({ session }: SessionDetailPageProps) {
  const profitColor = session.profit > 0 ? "green" : session.profit < 0 ? "red" : "gray";
  const profitSign = session.profit > 0 ? "+" : "";

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}時間${mins}分`;
    }
    if (hours > 0) {
      return `${hours}時間`;
    }
    return `${mins}分`;
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Button
            component={Link}
            href="/poker-sessions"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
          >
            一覧に戻る
          </Button>
          <Button
            component={Link}
            href={`/poker-sessions/${session.id}/edit`}
            leftSection={<IconEdit size={16} />}
          >
            編集
          </Button>
        </Group>

        <Paper shadow="sm" p="xl" withBorder>
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Title order={2}>{session.location.name}</Title>
                <Text size="sm" c="dimmed">
                  {formatDate(session.date)}
                </Text>
              </Stack>
              <Badge size="xl" color={profitColor} variant="filled">
                {profitSign}
                {formatCurrency(session.profit)}
              </Badge>
            </Group>

            <Stack gap="md">
              <Group gap="xl" grow>
                <Stack gap={4}>
                  <Text size="sm" c="dimmed">
                    バイイン
                  </Text>
                  <Text size="xl" fw={600}>
                    {formatCurrency(Number.parseFloat(session.buyIn))}
                  </Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="sm" c="dimmed">
                    キャッシュアウト
                  </Text>
                  <Text size="xl" fw={600}>
                    {formatCurrency(Number.parseFloat(session.cashOut))}
                  </Text>
                </Stack>
              </Group>

              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  プレイ時間
                </Text>
                <Text size="lg" fw={500}>
                  {formatDuration(session.durationMinutes)}
                </Text>
              </Stack>

              {session.notes && (
                <Stack gap={4}>
                  <Text size="sm" c="dimmed">
                    メモ
                  </Text>
                  <Paper p="md" withBorder>
                    <div
                      className="prose prose-sm max-w-none"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                      dangerouslySetInnerHTML={{ __html: session.notes }}
                      style={{
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}
                    />
                  </Paper>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
