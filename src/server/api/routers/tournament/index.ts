import { mergeRouters } from '../../trpc'
import { tournamentMutations } from './mutations'
import { tournamentQueries } from './queries'

/**
 * Tournament router for managing tournament configurations.
 *
 * All procedures require authentication (protectedProcedure).
 * Data isolation is enforced by filtering on userId.
 *
 * @see data-model.md Section 10-12. Tournament, TournamentPrizeStructure, TournamentPrizeLevel, TournamentPrizeItem, TournamentBlindLevel
 */
export const tournamentRouter = mergeRouters(
  tournamentQueries,
  tournamentMutations,
)
