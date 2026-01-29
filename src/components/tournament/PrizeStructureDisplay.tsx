'use client'

import {
  Box,
  Group,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
} from '@mantine/core'
import {
  IconCoins,
  IconGift,
  IconPercentage,
} from '@tabler/icons-react'
import { useState } from 'react'

import type { PrizeItem, PrizeStructure } from '~/app/(main)/stores/[id]/types'

interface PrizeStructureDisplayProps {
  prizeStructures: PrizeStructure[]
  maxHeight?: number
}

/**
 * Read-only display component for tournament prize structures.
 * Shows prize structure with tabs for different entry count ranges.
 */
export function PrizeStructureDisplay({
  prizeStructures,
  maxHeight = 300,
}: PrizeStructureDisplayProps) {
  const [activeTab, setActiveTab] = useState<string | null>('0')

  if (prizeStructures.length === 0) {
    return (
      <Text c="dimmed" py="md" size="sm" ta="center">
        プライズストラクチャーが設定されていません
      </Text>
    )
  }

  return (
    <Tabs onChange={setActiveTab} value={activeTab}>
      <Tabs.List>
        {prizeStructures.map((structure, sIdx) => (
          <Tabs.Tab key={`tab-${sIdx}`} value={String(sIdx)}>
            {structure.minEntrants}〜{structure.maxEntrants ?? '∞'}人
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {prizeStructures.map((structure, sIdx) => (
        <Tabs.Panel key={`panel-${sIdx}`} pt="xs" value={String(sIdx)}>
          <ScrollArea h={maxHeight - 40}>
            <Table
              horizontalSpacing="xs"
              verticalSpacing="xs"
              withRowBorders
              withTableBorder
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={100}>順位</Table.Th>
                  <Table.Th>プライズ</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {structure.prizeLevels.map((level, lIdx) => (
                  <Table.Tr key={`level-${lIdx}`}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {level.minPosition === level.maxPosition
                          ? `${level.minPosition}位`
                          : `${level.minPosition}〜${level.maxPosition}位`}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        {level.prizeItems.map((item, iIdx) => (
                          <PrizeItemDisplay key={`item-${iIdx}`} item={item} />
                        ))}
                        {level.prizeItems.length === 0 && (
                          <Text c="dimmed" size="xs">
                            プライズなし
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {structure.prizeLevels.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={2}>
                      <Text c="dimmed" size="sm" ta="center">
                        順位が設定されていません
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>
      ))}
    </Tabs>
  )
}

/**
 * Display a single prize item with appropriate icon and formatting.
 */
function PrizeItemDisplay({ item }: { item: PrizeItem }) {
  return (
    <Group gap={4} wrap="nowrap">
      <Box
        c={
          item.prizeType === 'percentage'
            ? 'blue'
            : item.prizeType === 'fixed_amount'
              ? 'green'
              : 'grape'
        }
        style={{ display: 'flex' }}
      >
        {item.prizeType === 'percentage' ? (
          <IconPercentage size={14} />
        ) : item.prizeType === 'fixed_amount' ? (
          <IconCoins size={14} />
        ) : (
          <IconGift size={14} />
        )}
      </Box>
      <Text size="sm">
        {item.prizeType === 'percentage' && item.percentage != null && (
          <>{item.percentage}%</>
        )}
        {item.prizeType === 'fixed_amount' && item.fixedAmount != null && (
          <>{item.fixedAmount.toLocaleString()}</>
        )}
        {item.prizeType === 'custom_prize' && (
          <>
            {item.customPrizeLabel ?? 'カスタム'}
            {item.customPrizeValue != null && (
              <Text c="dimmed" component="span" size="xs" ml={4}>
                ({item.customPrizeValue.toLocaleString()})
              </Text>
            )}
          </>
        )}
      </Text>
    </Group>
  )
}
