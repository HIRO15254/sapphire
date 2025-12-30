'use client'

import { Card, Divider, Group, Stack, Table, Text, Title } from '@mantine/core'
import {
  IconCalendar,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react'

import type { Session } from './types'
import {
  formatDate,
  formatProfitLoss,
  formatSessionDuration,
  getProfitLossColor,
} from './types'

interface SessionInfoProps {
  session: Session
}

export function SessionInfo({ session }: SessionInfoProps) {
  return (
    <>
      {/* Profit/Loss Summary */}
      <Card p="lg" radius="md" shadow="sm" withBorder>
        <Stack align="center" gap="md">
          <Group gap={8}>
            {session.profitLoss !== null && session.profitLoss > 0 && (
              <IconTrendingUp
                size={32}
                style={{ color: 'var(--mantine-color-green-6)' }}
              />
            )}
            {session.profitLoss !== null && session.profitLoss < 0 && (
              <IconTrendingDown
                size={32}
                style={{ color: 'var(--mantine-color-red-6)' }}
              />
            )}
            <Stack align="center" gap={0}>
              <Text
                c={getProfitLossColor(session.profitLoss)}
                fw={700}
                size="3rem"
              >
                {formatProfitLoss(session.profitLoss)}
              </Text>
              {/* EV-adjusted profit next to main profit */}
              {session.allInSummary &&
                session.allInSummary.count > 0 &&
                session.profitLoss !== null && (
                  <Text
                    c={getProfitLossColor(
                      session.profitLoss - session.allInSummary.evDifference,
                    )}
                    size="sm"
                  >
                    (EV:{' '}
                    {formatProfitLoss(
                      session.profitLoss - session.allInSummary.evDifference,
                    )}
                    )
                  </Text>
                )}
            </Stack>
          </Group>
          <Group gap="xl">
            <Stack align="center" gap={0}>
              <Text c="dimmed" size="sm">
                Buy-in
              </Text>
              <Text fw={500} size="lg">
                {session.buyIn.toLocaleString()}
              </Text>
            </Stack>
            <Stack align="center" gap={0}>
              <Text c="dimmed" size="sm">
                Cash-out
              </Text>
              <Text fw={500} size="lg">
                {(session.cashOut ?? 0).toLocaleString()}
              </Text>
            </Stack>
          </Group>
        </Stack>
      </Card>

      {/* Session Info */}
      <Card p="lg" radius="md" shadow="sm" withBorder>
        <Stack gap="md">
          <Group gap="sm">
            <IconCalendar size={20} />
            <Title order={3}>セッション情報</Title>
          </Group>
          <Divider />
          <Table withRowBorders={false}>
            <Table.Tbody>
              {session.store && (
                <Table.Tr>
                  <Table.Td c="dimmed" w={120}>
                    店舗
                  </Table.Td>
                  <Table.Td fw={500}>{session.store.name}</Table.Td>
                </Table.Tr>
              )}
              <Table.Tr>
                <Table.Td c="dimmed" w={120}>
                  日付
                </Table.Td>
                <Table.Td>{formatDate(session.startTime)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td c="dimmed" w={120}>
                  セッション時間
                </Table.Td>
                <Table.Td>
                  {formatSessionDuration(session.startTime, session.endTime)}
                </Table.Td>
              </Table.Tr>
              {session.cashGame && (
                <Table.Tr>
                  <Table.Td c="dimmed" w={120}>
                    ブラインド
                  </Table.Td>
                  <Table.Td>
                    {session.cashGame.smallBlind}/{session.cashGame.bigBlind}
                    {session.cashGame.currency && (
                      <Text c="dimmed" component="span" ml="xs" size="sm">
                        ({session.cashGame.currency.name})
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              )}
              {session.tournament && (
                <>
                  {session.tournament.name && (
                    <Table.Tr>
                      <Table.Td c="dimmed" w={120}>
                        トーナメント名
                      </Table.Td>
                      <Table.Td fw={500}>{session.tournament.name}</Table.Td>
                    </Table.Tr>
                  )}
                  <Table.Tr>
                    <Table.Td c="dimmed" w={120}>
                      バイイン
                    </Table.Td>
                    <Table.Td>
                      ¥{session.tournament.buyIn.toLocaleString()}
                      {session.tournament.rake && (
                        <Text c="dimmed" component="span" ml="xs" size="sm">
                          (レーキ: ¥{session.tournament.rake.toLocaleString()})
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                </>
              )}
              {session.notes && (
                <Table.Tr>
                  <Table.Td c="dimmed" w={120}>
                    メモ
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: 'pre-wrap' }}>
                    {session.notes}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </>
  )
}
