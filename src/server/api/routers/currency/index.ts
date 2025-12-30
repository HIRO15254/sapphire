import { mergeRouters } from '../../trpc'
import { bonusMutations } from './bonusMutations'
import { currencyMutations } from './currencyMutations'
import { purchaseMutations } from './purchaseMutations'
import { currencyQueries } from './queries'

/**
 * Currency router for managing virtual currencies and transactions.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 5-7
 */
export const currencyRouter = mergeRouters(
  currencyQueries,
  currencyMutations,
  bonusMutations,
  purchaseMutations,
)

// Re-export types
export type { BalanceBreakdown } from './helpers'
