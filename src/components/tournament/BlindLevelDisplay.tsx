'use client'

import { ScrollArea, Table, Text } from '@mantine/core'
import { IconCoffee } from '@tabler/icons-react'
import { useMemo } from 'react'

import type { BlindLevel } from '~/app/(main)/stores/[id]/types'

interface BlindLevelDisplayProps {
  blindLevels: BlindLevel[]
  maxHeight?: number
}

/**
 * Read-only display component for tournament blind levels.
 * Shows blind structure in a table format with break indicators.
 * Breaks don't increment the level number.
 */
export function BlindLevelDisplay({
  blindLevels,
  maxHeight = 300,
}: BlindLevelDisplayProps) {
  // Calculate display level numbers (breaks don't increment)
  const levelsWithDisplayNumber = useMemo(() => {
    let displayLevel = 0
    return blindLevels.map((level) => {
      // Explicitly check for true to handle 0/1/null/undefined cases
      const isBreak = level.isBreak === true
      if (!isBreak) {
        displayLevel++
      }
      return { ...level, isBreak, displayLevel: isBreak ? null : displayLevel }
    })
  }, [blindLevels])

  if (blindLevels.length === 0) {
    return (
      <Text c="dimmed" py="md" size="sm" ta="center">
        ブラインドレベルが設定されていません
      </Text>
    )
  }

  return (
    <ScrollArea h={maxHeight} type="auto">
      <Table
        horizontalSpacing="xs"
        verticalSpacing={4}
        withRowBorders
        withTableBorder
        stickyHeader
        styles={{
          th: { padding: '6px 8px' },
          td: { padding: '4px 8px' },
        }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={35}>Lv</Table.Th>
            <Table.Th w={65}>SB</Table.Th>
            <Table.Th w={65}>BB</Table.Th>
            <Table.Th w={55}>Ante</Table.Th>
            <Table.Th w={50}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {levelsWithDisplayNumber.map((level, index) =>
            level.isBreak ? (
              <Table.Tr
                key={`break-${index}`}
                style={{ backgroundColor: 'var(--mantine-color-orange-light)' }}
              >
                <Table.Td colSpan={4} style={{ textAlign: 'center' }}>
                  <Text
                    c="orange"
                    fw={500}
                    size="sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <IconCoffee size={14} />
                    Break
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{level.durationMinutes} min</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              <Table.Tr key={`level-${level.displayLevel}-${index}`}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {level.displayLevel}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {level.smallBlind?.toLocaleString() ?? '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {level.bigBlind?.toLocaleString() ?? '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c={level.ante ? undefined : 'dimmed'}>
                    {level.ante?.toLocaleString() ?? '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{level.durationMinutes} min</Text>
                </Table.Td>
              </Table.Tr>
            ),
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}
