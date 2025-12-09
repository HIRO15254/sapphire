import { Card, Group, Stack, Table, Text, Title } from "@mantine/core";
import { IconMapPin } from "@tabler/icons-react";

interface LocationGameStat {
  location: {
    id: number;
    name: string;
  };
  game: {
    id: number;
    name: string;
  };
  currency: {
    id: number;
    prefix: string;
  };
  profit: number;
  durationMinutes: number;
  count: number;
  hourlyRate: number;
}

interface LocationStatsProps {
  byLocation: LocationGameStat[];
}

/**
 * プレイ時間を「X時間Y分」形式でフォーマット
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

/**
 * 通貨単位で収支をフォーマット（プレフィックス付き）
 */
function formatCurrencyWithPrefix(value: number, prefix: string): string {
  const sign = value >= 0 ? "+" : "";
  const formatted = Math.abs(value).toLocaleString();
  if (prefix) {
    return `${sign}${formatted} ${prefix}`;
  }
  return `${sign}${formatted}`;
}

export function LocationStats({ byLocation }: LocationStatsProps) {
  if (byLocation.length === 0) {
    return null; // Don't show anything if no location data
  }

  return (
    <Card withBorder p="md">
      <Stack gap="md">
        <Group gap="xs">
          <IconMapPin size={20} />
          <Title order={3}>場所/ゲーム別統計</Title>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>場所 / ゲーム</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>収支</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>プレイ時間</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>平均時給</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {byLocation.map((stat) => {
              const profitColor = stat.profit > 0 ? "green" : stat.profit < 0 ? "red" : "gray";
              const hourlyRateColor =
                stat.hourlyRate > 0 ? "green" : stat.hourlyRate < 0 ? "red" : "gray";

              return (
                <Table.Tr key={`${stat.location.id}-${stat.game.id}`}>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text fw={500}>{stat.location.name}</Text>
                      <Text size="xs" c="dimmed">
                        {stat.game.name}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text c={profitColor} fw={600}>
                      {formatCurrencyWithPrefix(stat.profit, stat.currency.prefix)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text>{formatDuration(stat.durationMinutes)}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text c={hourlyRateColor}>
                      {formatCurrencyWithPrefix(stat.hourlyRate, stat.currency.prefix)}/h
                    </Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
}
