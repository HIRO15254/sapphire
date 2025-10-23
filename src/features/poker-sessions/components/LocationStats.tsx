import { Badge, Card, Group, Stack, Table, Text, Title } from "@mantine/core";
import { IconMapPin } from "@tabler/icons-react";

import { formatCurrency } from "@/lib/utils/currency";

interface LocationStat {
  location: string;
  profit: number;
  count: number;
  avgProfit: number;
}

interface LocationStatsProps {
  byLocation: LocationStat[];
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
          <Title order={3}>場所別統計</Title>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>場所</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>収支</Table.Th>
              <Table.Th style={{ textAlign: "center" }}>セッション数</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>平均収支</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {byLocation.map((stat) => {
              const profitColor = stat.profit > 0 ? "green" : stat.profit < 0 ? "red" : "gray";
              const avgProfitColor =
                stat.avgProfit > 0 ? "green" : stat.avgProfit < 0 ? "red" : "gray";

              return (
                <Table.Tr key={stat.location}>
                  <Table.Td>
                    <Text fw={500}>{stat.location}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text c={profitColor} fw={600}>
                      {formatCurrency(stat.profit)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Badge variant="light" color="blue">
                      {stat.count}回
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text c={avgProfitColor}>{formatCurrency(stat.avgProfit)}</Text>
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
