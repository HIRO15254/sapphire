'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  type BlindLevelInput,
  blindLevelSchema,
} from '~/server/api/schemas/tournament.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  isNotDeleted,
  tournamentBlindLevels,
  tournaments,
} from '~/server/db/schema'
import type { ActionResult } from './store'

/**
 * Set blind levels for a tournament (replaces all existing).
 *
 * Revalidates: store-{storeId}
 */
export async function setTournamentBlindLevels(input: {
  tournamentId: string
  levels: BlindLevelInput[]
}): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate levels
    const validatedLevels = input.levels.map((level) =>
      blindLevelSchema.parse(level),
    )

    // Verify ownership
    const existing = await db.query.tournaments.findFirst({
      where: and(
        eq(tournaments.id, input.tournamentId),
        eq(tournaments.userId, session.user.id),
        isNotDeleted(tournaments.deletedAt),
      ),
    })

    if (!existing) {
      return { success: false, error: 'トーナメントが見つかりません' }
    }

    // Delete existing blind levels
    await db
      .delete(tournamentBlindLevels)
      .where(eq(tournamentBlindLevels.tournamentId, input.tournamentId))

    // Insert new blind levels
    if (validatedLevels.length > 0) {
      await db.insert(tournamentBlindLevels).values(
        validatedLevels.map((level) => ({
          tournamentId: input.tournamentId,
          level: level.level,
          smallBlind: level.smallBlind,
          bigBlind: level.bigBlind,
          ante: level.ante,
          durationMinutes: level.durationMinutes,
        })),
      )
    }

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to set blind levels:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'ブラインドレベルの設定に失敗しました',
    }
  }
}
