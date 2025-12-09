"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Button, Card, Grid, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
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
  /** 総収支（BB単位） - nullの場合はゲーム未設定 */
  totalProfitBB?: number | null;
  /** 平均収支（BB単位） - nullの場合はゲーム未設定 */
  avgProfitBB?: number | null;
  /** ゲームが設定されているセッション数 */
  sessionsWithGameCount?: number;
}

/**
 * ダッシュボード統計情報コンポーネント
 *
 * 責務:
 * - 統計情報の表示（総収支、セッション数、平均収支、総プレイ時間）
 * - 利益/損失の色分け表示
 * - セッションがない場合の空状態表示
 * - コンパクトなレイアウト（アイコン+タイトルを1行に）
 */
export function DashboardStats({
  totalProfit,
  sessionCount,
  avgProfit,
  totalDurationMinutes,
  totalProfitBB,
  avgProfitBB,
  sessionsWithGameCount = 0,
}: DashboardStatsProps) {
  // 空状態
  if (sessionCount === 0) {
    return (
      <Card withBorder p="lg">
        <Stack align="center" gap="sm">
          <IconPokerChip size={40} color="gray" />
          <Title order={4} c="dimmed">
            セッションがありません
          </Title>
          <Text c="dimmed" size="sm">
            最初のセッションを記録して統計を表示しましょう
          </Text>
          <Button component={Link} href="/poker-sessions/new" variant="filled" size="sm">
            セッションを記録
          </Button>
        </Stack>
      </Card>
    );
  }

  // BB単位の色分け
  const profitBBColor =
    totalProfitBB !== null && totalProfitBB !== undefined
      ? totalProfitBB > 0
        ? "green"
        : totalProfitBB < 0
          ? "red"
          : "gray"
      : "gray";
  const avgProfitBBColor =
    avgProfitBB !== null && avgProfitBB !== undefined
      ? avgProfitBB > 0
        ? "green"
        : avgProfitBB < 0
          ? "red"
          : "gray"
      : "gray";

  // BB統計が利用可能かどうか
  const hasBBStats = totalProfitBB !== null && totalProfitBB !== undefined;
  const partialBBStats = hasBBStats && sessionsWithGameCount < sessionCount;

  // BB表示のフォーマット
  const formatBB = (bb: number | null | undefined): string => {
    if (bb === null || bb === undefined) return "-";
    const sign = bb >= 0 ? "+" : "";
    return `${sign}${bb.toFixed(1)} BB`;
  };

  return (
    <Grid gutter="sm">
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Tooltip
          label={
            partialBBStats
              ? `${sessionsWithGameCount}/${sessionCount}セッションの統計 (${formatCurrency(totalProfit)})`
              : formatCurrency(totalProfit)
          }
          withArrow
        >
          <Card withBorder p="sm" h="100%">
            <Group gap="xs" align="center" mb={4}>
              <IconCash size={16} color={`var(--mantine-color-${profitBBColor}-6)`} />
              <Text size="xs" c="dimmed">
                総収支
              </Text>
            </Group>
            <Title
              order={3}
              c={profitBBColor}
              style={{ color: `var(--mantine-color-${profitBBColor}-6)` }}
            >
              {hasBBStats ? formatBB(totalProfitBB) : formatCurrency(totalProfit)}
            </Title>
            {partialBBStats && (
              <Text size="xs" c="dimmed">
                {sessionsWithGameCount}/{sessionCount}セッション
              </Text>
            )}
          </Card>
        </Tooltip>
      </Grid.Col>

      <Grid.Col span={{ base: 6, md: 3 }}>
        <Card withBorder p="sm" h="100%">
          <Group gap="xs" align="center" mb={4}>
            <IconPokerChip size={16} color="var(--mantine-color-blue-6)" />
            <Text size="xs" c="dimmed">
              セッション数
            </Text>
          </Group>
          <Title order={3}>{sessionCount}</Title>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 6, md: 3 }}>
        <Tooltip
          label={
            partialBBStats
              ? `${sessionsWithGameCount}/${sessionCount}セッションの平均 (${formatCurrency(avgProfit)})`
              : formatCurrency(avgProfit)
          }
          withArrow
        >
          <Card withBorder p="sm" h="100%">
            <Group gap="xs" align="center" mb={4}>
              <IconChartLine size={16} color={`var(--mantine-color-${avgProfitBBColor}-6)`} />
              <Text size="xs" c="dimmed">
                平均収支
              </Text>
            </Group>
            <Title
              order={3}
              c={avgProfitBBColor}
              style={{ color: `var(--mantine-color-${avgProfitBBColor}-6)` }}
            >
              {hasBBStats ? formatBB(avgProfitBB) : formatCurrency(avgProfit)}
            </Title>
            {partialBBStats && (
              <Text size="xs" c="dimmed">
                {sessionsWithGameCount}/{sessionCount}セッション
              </Text>
            )}
          </Card>
        </Tooltip>
      </Grid.Col>

      <Grid.Col span={{ base: 6, md: 3 }}>
        <Card withBorder p="sm" h="100%">
          <Group gap="xs" align="center" mb={4}>
            <IconClock size={16} color="var(--mantine-color-blue-6)" />
            <Text size="xs" c="dimmed">
              総プレイ時間
            </Text>
          </Group>
          <Title order={3}>{formatDuration(totalDurationMinutes)}</Title>
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
