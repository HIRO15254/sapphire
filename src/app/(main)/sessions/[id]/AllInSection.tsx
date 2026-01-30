'use client'

import {
  ActionIcon,
  Badge,
  Card,
  Divider,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconEdit,
  IconPlus,
  IconPokerChip,
  IconTrash,
} from '@tabler/icons-react'

import type { AllInRecord } from './types'
import { formatProfitLoss } from './types'

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
    <Card radius="sm" shadow="xs" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500}>オールイン記録</Text>
          <ActionIcon
            aria-label="オールインを追加"
            onClick={onAddClick}
            variant="light"
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>
        <Divider />
        {allInRecords && allInRecords.length > 0 ? (
          <Stack gap="xs">
            {allInRecords.map((record) => {
              const winProb = Number.parseFloat(record.winProbability)
              const ev = record.potAmount * (winProb / 100)
              const hasRunIt =
                record.runItTimes != null && record.runItTimes > 1
              const actualResult = hasRunIt
                ? record.potAmount *
                  ((record.winsInRunout ?? 0) / (record.runItTimes ?? 1))
                : record.actualResult
                  ? record.potAmount
                  : 0
              const evDiff = actualResult - ev

              return (
                <Group
                  gap="xs"
                  justify="space-between"
                  key={record.id}
                  wrap="nowrap"
                >
                  <Stack gap={2}>
                    <Text fw={500} size="sm">
                      ポット: {record.potAmount.toLocaleString()}
                    </Text>
                    <Group gap={4}>
                      <Badge size="xs" variant="light">
                        {winProb.toFixed(1)}%
                      </Badge>
                      {hasRunIt ? (
                        <Badge color="blue" size="xs" variant="light">
                          {record.winsInRunout}/{record.runItTimes}
                        </Badge>
                      ) : record.actualResult ? (
                        <Badge color="green" size="xs">
                          Win
                        </Badge>
                      ) : (
                        <Badge color="red" size="xs">
                          Lose
                        </Badge>
                      )}
                    </Group>
                  </Stack>
                  <Stack align="flex-end" gap={2}>
                    <Text
                      c={evDiff >= 0 ? 'green' : 'red'}
                      fw={700}
                      size="sm"
                    >
                      EV {formatProfitLoss(evDiff)}
                    </Text>
                    <Group gap={4}>
                      <ActionIcon
                        onClick={() => onEditClick(record)}
                        size="sm"
                        title="編集"
                        variant="subtle"
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        onClick={() => onDeleteClick(record.id)}
                        size="sm"
                        title="削除"
                        variant="subtle"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Group>
              )
            })}
          </Stack>
        ) : (
          <Stack align="center" gap="xs" py="md">
            <IconPokerChip color="gray" size={32} />
            <Text c="dimmed" size="sm">
              オールイン記録がありません
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
