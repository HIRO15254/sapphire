'use client'

import { Card, Group, SegmentedControl, Stack, Text } from '@mantine/core'
import { useState } from 'react'

import { SessionProfitChart } from '~/components/sessions/SessionProfitChart'
import type { Session } from './types'
import { formatProfitLoss, getProfitLossColor } from './types'

interface SessionSummaryProps {
  session: Session
}

/**
 * Calculate total buy-in including rebuys and addons from session events.
 */
function getTotalBuyIn(session: Session): number {
  const total = session.buyIn
  return total
}

export function SessionSummary({ session }: SessionSummaryProps) {
  const hasEvents = session.sessionEvents.length > 0
  const [topView, setTopView] = useState<'summary' | 'chart'>('summary')

  const totalBuyIn = getTotalBuyIn(session)

  return (
    <Card radius="sm" shadow="xs" withBorder>
      <Stack gap="sm">
        {hasEvents && (
          <SegmentedControl
            data={[
              { label: 'サマリー', value: 'summary' },
              { label: 'グラフ', value: 'chart' },
            ]}
            fullWidth
            onChange={(value) => setTopView(value as 'summary' | 'chart')}
            size="xs"
            value={topView}
          />
        )}

        {topView === 'summary' && (
          <Stack align="center" gap="xs" py="sm">
            <Text
              c={getProfitLossColor(session.profitLoss)}
              fw={700}
              fz="2rem"
            >
              {formatProfitLoss(session.profitLoss)}
            </Text>
            {session.allInSummary &&
              session.allInSummary.count > 0 &&
              session.profitLoss !== null && (
                <Text c="dimmed" size="sm">
                  EV調整後:{' '}
                  <Text
                    c={getProfitLossColor(
                      session.profitLoss -
                        session.allInSummary.evDifference,
                    )}
                    component="span"
                    fw={500}
                    size="sm"
                  >
                    {formatProfitLoss(
                      session.profitLoss -
                        session.allInSummary.evDifference,
                    )}
                  </Text>
                </Text>
              )}
            <Group gap="xl" mt="xs">
              <Stack align="center" gap={0}>
                <Text c="dimmed" size="xs">
                  Buy-in
                </Text>
                <Text fw={500} size="sm">
                  {totalBuyIn.toLocaleString()}
                </Text>
              </Stack>
              <Stack align="center" gap={0}>
                <Text c="dimmed" size="xs">
                  Cash-out
                </Text>
                <Text fw={500} size="sm">
                  {(session.cashOut ?? 0).toLocaleString()}
                </Text>
              </Stack>
            </Group>
          </Stack>
        )}

        {topView === 'chart' && hasEvents && (
          <SessionProfitChart
            allInRecords={session.allInRecords}
            bigBlind={session.cashGame?.bigBlind}
            buyIn={session.buyIn}
            cashOut={session.cashOut}
            endTime={session.endTime}
            height={200}
            sessionEvents={session.sessionEvents}
            withDots
          />
        )}
      </Stack>
    </Card>
  )
}
