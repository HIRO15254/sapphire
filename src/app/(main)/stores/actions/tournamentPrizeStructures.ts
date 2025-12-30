'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  type PrizeStructureInput,
  prizeStructureSchema,
} from '~/server/api/schemas/tournament.schema'
import { auth } from '~/server/auth'
import { db } from '~/server/db'
import {
  isNotDeleted,
  tournamentPrizeItems,
  tournamentPrizeLevels,
  tournamentPrizeStructures,
  tournaments,
} from '~/server/db/schema'
import type { ActionResult } from './store'

/**
 * Set prize structures for a tournament (replaces all existing).
 * Hierarchical: Structure -> Level -> Item
 *
 * Revalidates: store-{storeId}
 */
export async function setTournamentPrizeStructures(input: {
  tournamentId: string
  structures: PrizeStructureInput[]
}): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // Validate structures
    const validatedStructures = input.structures.map((structure) =>
      prizeStructureSchema.parse(structure),
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

    // Delete existing prize structures (cascades to levels and items)
    await db
      .delete(tournamentPrizeStructures)
      .where(eq(tournamentPrizeStructures.tournamentId, input.tournamentId))

    // Insert new prize structures (hierarchical)
    for (const [sIdx, structure] of validatedStructures.entries()) {
      const [newStructure] = await db
        .insert(tournamentPrizeStructures)
        .values({
          tournamentId: input.tournamentId,
          minEntrants: structure.minEntrants,
          maxEntrants: structure.maxEntrants ?? null,
          sortOrder: structure.sortOrder ?? sIdx,
        })
        .returning()

      if (newStructure && structure.prizeLevels.length > 0) {
        for (const [lIdx, level] of structure.prizeLevels.entries()) {
          const [newLevel] = await db
            .insert(tournamentPrizeLevels)
            .values({
              prizeStructureId: newStructure.id,
              minPosition: level.minPosition,
              maxPosition: level.maxPosition,
              sortOrder: level.sortOrder ?? lIdx,
            })
            .returning()

          if (newLevel && level.prizeItems.length > 0) {
            await db.insert(tournamentPrizeItems).values(
              level.prizeItems.map((item, iIdx) => ({
                prizeLevelId: newLevel.id,
                prizeType: item.prizeType,
                percentage: item.percentage?.toString() ?? null,
                fixedAmount: item.fixedAmount ?? null,
                customPrizeLabel: item.customPrizeLabel ?? null,
                customPrizeValue: item.customPrizeValue ?? null,
                sortOrder: item.sortOrder ?? iIdx,
              })),
            )
          }
        }
      }
    }

    // Revalidate store detail
    revalidateTag(`store-${existing.storeId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to set prize structures:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'プライズストラクチャーの設定に失敗しました',
    }
  }
}
