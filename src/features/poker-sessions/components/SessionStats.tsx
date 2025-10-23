import { Badge, Card, Grid, Stack, Text, Title } from "@mantine/core";
import { IconCash, IconChartLine, IconPokerChip } from "@tabler/icons-react";

import { formatCurrency } from "@/lib/utils/currency";

interface SessionStatsProps {
  totalProfit: number;
  sessionCount: number;
  avgProfit: number;
}

export function SessionStats({ totalProfit, sessionCount, avgProfit }: SessionStatsProps) {
  // Show empty state for users with no sessions
  if (sessionCount === 0) {
    return (
      <Card withBorder p="xl">
        <Stack align="center" gap="md">
          <IconPokerChip size={48} color="gray" />
          <Title order={3} c="dimmed">
            セッションがありません
          </Title>
          <Text c="dimmed">最初のセッションを記録して統計を表示しましょう</Text>
        </Stack>
      </Card>
    );
  }

  const profitColor = totalProfit > 0 ? "green" : totalProfit < 0 ? "red" : "gray";
  const avgProfitColor = avgProfit > 0 ? "green" : avgProfit < 0 ? "red" : "gray";

  return (
    <Grid gutter="md">
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Card withBorder p="md" h="100%">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              総収支
            </Text>
            <Stack gap={4} align="flex-start">
              <Title order={2} c={profitColor}>
                {formatCurrency(totalProfit)}
              </Title>
              {totalProfit !== 0 && (
                <Badge color={profitColor} variant="light" leftSection={<IconCash size={12} />}>
                  {totalProfit > 0 ? "利益" : "損失"}
                </Badge>
              )}
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Card withBorder p="md" h="100%">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              セッション数
            </Text>
            <Stack gap={4} align="flex-start">
              <Title order={2}>{sessionCount}</Title>
              <Badge color="blue" variant="light" leftSection={<IconPokerChip size={12} />}>
                合計
              </Badge>
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Card withBorder p="md" h="100%">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              平均収支
            </Text>
            <Stack gap={4} align="flex-start">
              <Title order={2} c={avgProfitColor}>
                {formatCurrency(avgProfit)}
              </Title>
              {avgProfit !== 0 && (
                <Badge
                  color={avgProfitColor}
                  variant="light"
                  leftSection={<IconChartLine size={12} />}
                >
                  1セッション
                </Badge>
              )}
            </Stack>
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  );
}
