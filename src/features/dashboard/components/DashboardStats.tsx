"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Button, Card, Grid, Stack, Text, Title } from "@mantine/core";
import { IconCash, IconChartLine, IconClock, IconPokerChip } from "@tabler/icons-react";
import Link from "next/link";

interface DashboardStatsProps {
  /** 総収支 */
  totalProfit: number;
  /** セッション数 */
  sessionCount: number;
  /** 平均収支 */
  avgProfit: number;
  /** 総プレイ時間（分） */
  totalDurationMinutes: number;
}

/**
 * ダッシュボード統計情報コンポーネント
 *
 * 責務:
 * - 統計情報の表示（総収支、セッション数、平均収支、総プレイ時間）
 * - 利益/損失の色分け表示
 * - セッションがない場合の空状態表示
 */
export function DashboardStats({
  totalProfit,
  sessionCount,
  avgProfit,
  totalDurationMinutes,
}: DashboardStatsProps) {
  // 空状態
  if (sessionCount === 0) {
    return (
      <Card withBorder p="xl">
        <Stack align="center" gap="md">
          <IconPokerChip size={48} color="gray" />
          <Title order={3} c="dimmed">
            セッションがありません
          </Title>
          <Text c="dimmed">最初のセッションを記録して統計を表示しましょう</Text>
          <Button component={Link} href="/poker-sessions/new" variant="filled">
            セッションを記録
          </Button>
        </Stack>
      </Card>
    );
  }

  const profitColor = totalProfit > 0 ? "green" : totalProfit < 0 ? "red" : "gray";
  const avgProfitColor = avgProfit > 0 ? "green" : avgProfit < 0 ? "red" : "gray";

  return (
    <Grid gutter="md">
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder p="md" h="100%">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              総収支
            </Text>
            <Stack gap={4} align="flex-start">
              <Title
                order={2}
                c={profitColor}
                style={{ color: `var(--mantine-color-${profitColor}-6)` }}
              >
                {formatCurrency(totalProfit)}
              </Title>
              <IconCash size={20} color={`var(--mantine-color-${profitColor}-6)`} />
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder p="md" h="100%">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              セッション数
            </Text>
            <Stack gap={4} align="flex-start">
              <Title order={2}>{sessionCount}</Title>
              <IconPokerChip size={20} color="var(--mantine-color-blue-6)" />
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder p="md" h="100%">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              平均収支
            </Text>
            <Stack gap={4} align="flex-start">
              <Title
                order={2}
                c={avgProfitColor}
                style={{ color: `var(--mantine-color-${avgProfitColor}-6)` }}
              >
                {formatCurrency(avgProfit)}
              </Title>
              <IconChartLine size={20} color={`var(--mantine-color-${avgProfitColor}-6)`} />
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder p="md" h="100%">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              総プレイ時間
            </Text>
            <Stack gap={4} align="flex-start">
              <Title order={2}>{formatDuration(totalDurationMinutes)}</Title>
              <IconClock size={20} color="var(--mantine-color-blue-6)" />
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  );
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
