import { allInRouter } from '~/server/api/routers/allIn'
import { authRouter } from '~/server/api/routers/auth'
import { cashGameRouter } from '~/server/api/routers/cashGame'
import { currencyRouter } from '~/server/api/routers/currency/index'
import { sessionRouter } from '~/server/api/routers/session'
import { storeRouter } from '~/server/api/routers/store'
import { tournamentRouter } from '~/server/api/routers/tournament/index'
import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from '~/server/api/trpc'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  allIn: allInRouter,
  auth: authRouter,
  cashGame: cashGameRouter,
  currency: currencyRouter,
  session: sessionRouter,
  store: storeRouter,
  tournament: tournamentRouter,
  /**
   * Health check procedure.
   * Returns the current server status.
   */
  health: publicProcedure.query(() => ({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  })),
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
