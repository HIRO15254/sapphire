import { Card, Grid, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { IconCash, IconChartLine, IconPokerChip } from "@tabler/icons-react";

import { formatCurrency } from "@/lib/utils/currency";

interface SessionStatsProps {
  totalProfit: number;
  sessionCount: number;
  avgProfit: number;
  /** 総収支（BB単位） - nullの場合はゲーム未設定 */
  totalProfitBB?: number | null;
  /** 平均収支（BB単位） - nullの場合はゲーム未設定 */
  avgProfitBB?: number | null;
  /** ゲームが設定されているセッション数 */
  sessionsWithGameCount?: number;
}

export function SessionStats({
  totalProfit,
  sessionCount,
  avgProfit,
  totalProfitBB,
  avgProfitBB,
  sessionsWithGameCount = 0,
}: SessionStatsProps) {
  // Show empty state for users with no sessions
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
        </Stack>
      </Card>
    );
  }

  // BB単位の色分け
  const profitBBColor = totalProfitBB !== null && totalProfitBB !== undefined
    ? totalProfitBB > 0 ? "green" : totalProfitBB < 0 ? "red" : "gray"
    : "gray";
  const avgProfitBBColor = avgProfitBB !== null && avgProfitBB !== undefined
    ? avgProfitBB > 0 ? "green" : avgProfitBB < 0 ? "red" : "gray"
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
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Tooltip
          label={partialBBStats
            ? `${sessionsWithGameCount}/${sessionCount}セッションの統計 (${formatCurrency(totalProfit)})`
            : formatCurrency(totalProfit)}
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

      <Grid.Col span={{ base: 12, sm: 4 }}>
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

      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Tooltip
          label={partialBBStats
            ? `${sessionsWithGameCount}/${sessionCount}セッションの平均 (${formatCurrency(avgProfit)})`
            : formatCurrency(avgProfit)}
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
    </Grid>
  );
}
