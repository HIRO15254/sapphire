'use client'

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import {
  IconChartBar,
  IconEdit,
  IconPlus,
  IconPokerChip,
  IconTrash,
} from '@tabler/icons-react'

import type { AllInRecord } from './types'
import { formatEV, formatProfitLoss } from './types'

interface AllInSectionProps {
  allInRecords: AllInRecord[]
  onAddClick: () => void
  onEditClick: (record: AllInRecord) => void
  onDeleteClick: (recordId: string) => void
}

export function AllInSection({
  allInRecords,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: AllInSectionProps) {
  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <IconPokerChip size={20} />
            <Title order={3}>オールイン記録</Title>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onAddClick}
            size="sm"
            variant="light"
          >
            オールインを追加
          </Button>
        </Group>
        <Divider />
        {allInRecords && allInRecords.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ textAlign: 'right' }}>ポット</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>勝率</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>結果</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>実収支</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {allInRecords.map((record) => {
                const winProb = Number.parseFloat(record.winProbability)
                const ev = record.potAmount * (winProb / 100)
                const hasRunIt =
                  record.runItTimes != null && record.runItTimes > 1
                // Calculate actual result
                const actualResult = hasRunIt
                  ? record.potAmount *
                    ((record.winsInRunout ?? 0) / (record.runItTimes ?? 1))
                  : record.actualResult
                    ? record.potAmount
                    : 0
                const evDiff = actualResult - ev
                return (
                  <Table.Tr key={record.id}>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {record.potAmount.toLocaleString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {winProb.toFixed(1)}%
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {hasRunIt ? (
                        <Badge color="blue" size="sm" variant="light">
                          {record.winsInRunout}/{record.runItTimes}
                        </Badge>
                      ) : record.actualResult ? (
                        <Badge color="green" size="sm">
                          勝ち
                        </Badge>
                      ) : (
                        <Badge color="red" size="sm">
                          負け
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Stack align="flex-end" gap={0}>
                        <Text size="sm">{formatEV(actualResult)}</Text>
                        <Text c={evDiff >= 0 ? 'green' : 'red'} size="xs">
                          (EV {formatProfitLoss(evDiff)})
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
                        <ActionIcon
                          onClick={() => onEditClick(record)}
                          title="編集"
                          variant="subtle"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          onClick={() => onDeleteClick(record.id)}
                          title="削除"
                          variant="subtle"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        ) : (
          <Stack align="center" gap="md" py="xl">
            <IconChartBar color="gray" size={48} />
            <Text c="dimmed" size="lg">
              オールイン記録がありません
            </Text>
            <Text c="dimmed" size="sm">
              オールイン記録を追加すると、EVの分析ができます
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
