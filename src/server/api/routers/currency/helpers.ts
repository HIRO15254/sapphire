import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm'

import type { db } from '~/server/db'
import {
  bonusTransactions,
  cashGames,
  currencies,
  isNotDeleted,
  pokerSessions,
  purchaseTransactions,
  tournaments,
} from '~/server/db/schema'

/** Balance calculation result type */
export type BalanceBreakdown = {
  totalBonuses: number
  totalPurchases: number
  totalBuyIns: number
  totalCashOuts: number
  currentBalance: number
}

/**
 * Calculate the current balance and breakdown for a currency.
 *
 * Balance formula:
 * currentBalance = initialBalance + Σ(bonuses) + Σ(purchases) - Σ(buyIns) + Σ(cashOuts)
 *
 * Session buy-ins and cashouts are calculated from completed sessions
 * (sessions with cashOut != null) linked to this currency through
 * cash games or tournaments.
 */
export async function calculateCurrencyBalance(
  database: typeof db,
  currencyId: string,
): Promise<BalanceBreakdown> {
  // Get currency initial balance
  const currency = await database.query.currencies.findFirst({
    where: eq(currencies.id, currencyId),
    columns: { initialBalance: true },
  })

  if (!currency) {
    return {
      totalBonuses: 0,
      totalPurchases: 0,
      totalBuyIns: 0,
      totalCashOuts: 0,
      currentBalance: 0,
    }
  }

  // Calculate total bonuses
  const bonusResult = await database
    .select({
      total: sql<number>`COALESCE(SUM(${bonusTransactions.amount}), 0)::integer`,
    })
    .from(bonusTransactions)
    .where(
      and(
        eq(bonusTransactions.currencyId, currencyId),
        isNotDeleted(bonusTransactions.deletedAt),
      ),
    )

  // Calculate total purchases
  const purchaseResult = await database
    .select({
      total: sql<number>`COALESCE(SUM(${purchaseTransactions.amount}), 0)::integer`,
    })
    .from(purchaseTransactions)
    .where(
      and(
        eq(purchaseTransactions.currencyId, currencyId),
        isNotDeleted(purchaseTransactions.deletedAt),
      ),
    )

  const totalBonuses = bonusResult[0]?.total ?? 0
  const totalPurchases = purchaseResult[0]?.total ?? 0

  // Get cash game IDs that use this currency
  const cashGameIds = await database
    .select({ id: cashGames.id })
    .from(cashGames)
    .where(
      and(
        eq(cashGames.currencyId, currencyId),
        isNotDeleted(cashGames.deletedAt),
      ),
    )

  // Get tournament IDs that use this currency
  const tournamentIds = await database
    .select({ id: tournaments.id })
    .from(tournaments)
    .where(
      and(
        eq(tournaments.currencyId, currencyId),
        isNotDeleted(tournaments.deletedAt),
      ),
    )

  const cashGameIdList = cashGameIds.map((cg) => cg.id)
  const tournamentIdList = tournamentIds.map((t) => t.id)

  // Calculate total buy-ins from sessions (completed sessions only)
  let totalBuyIns = 0
  let totalCashOuts = 0

  // Buy-ins from cash game sessions
  if (cashGameIdList.length > 0) {
    const cashBuyInResult = await database
      .select({
        total: sql<number>`COALESCE(SUM(${pokerSessions.buyIn}), 0)::integer`,
      })
      .from(pokerSessions)
      .where(
        and(
          inArray(pokerSessions.cashGameId, cashGameIdList),
          isNotDeleted(pokerSessions.deletedAt),
          isNotNull(pokerSessions.cashOut), // Only completed sessions
        ),
      )
    totalBuyIns += cashBuyInResult[0]?.total ?? 0

    const cashCashOutResult = await database
      .select({
        total: sql<number>`COALESCE(SUM(${pokerSessions.cashOut}), 0)::integer`,
      })
      .from(pokerSessions)
      .where(
        and(
          inArray(pokerSessions.cashGameId, cashGameIdList),
          isNotDeleted(pokerSessions.deletedAt),
          isNotNull(pokerSessions.cashOut),
        ),
      )
    totalCashOuts += cashCashOutResult[0]?.total ?? 0
  }

  // Buy-ins from tournament sessions
  if (tournamentIdList.length > 0) {
    const tournamentBuyInResult = await database
      .select({
        total: sql<number>`COALESCE(SUM(${pokerSessions.buyIn}), 0)::integer`,
      })
      .from(pokerSessions)
      .where(
        and(
          inArray(pokerSessions.tournamentId, tournamentIdList),
          isNotDeleted(pokerSessions.deletedAt),
          isNotNull(pokerSessions.cashOut), // Only completed sessions
        ),
      )
    totalBuyIns += tournamentBuyInResult[0]?.total ?? 0

    const tournamentCashOutResult = await database
      .select({
        total: sql<number>`COALESCE(SUM(${pokerSessions.cashOut}), 0)::integer`,
      })
      .from(pokerSessions)
      .where(
        and(
          inArray(pokerSessions.tournamentId, tournamentIdList),
          isNotDeleted(pokerSessions.deletedAt),
          isNotNull(pokerSessions.cashOut),
        ),
      )
    totalCashOuts += tournamentCashOutResult[0]?.total ?? 0
  }

  const currentBalance =
    currency.initialBalance +
    totalBonuses +
    totalPurchases -
    totalBuyIns +
    totalCashOuts

  return {
    totalBonuses,
    totalPurchases,
    totalBuyIns,
    totalCashOuts,
    currentBalance,
  }
}
