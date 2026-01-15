'use client'

import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  TypographyStylesProvider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconChartPie,
  IconClock,
  IconEdit,
  IconRefresh,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { BlindLevelDisplay } from '~/components/tournament/BlindLevelDisplay'
import { PrizeStructureDisplay } from '~/components/tournament/PrizeStructureDisplay'
import type { RouterOutputs } from '~/trpc/react'
import { api } from '~/trpc/react'

import { EditChoiceDialog } from './EditChoiceDialog'
import { TournamentEditModal } from './TournamentEditModal'
import type {
  BlindLevel,
  EditChoice,
  PrizeStructure,
  SessionTournamentData,
  TournamentEditMode,
} from './types'

type ActiveSession = NonNullable<RouterOutputs['sessionEvent']['getActiveSession']>

interface TournamentInfoTabProps {
  session: ActiveSession
}

/**
 * Tournament info tab component for active session.
 * Displays tournament basic info, blind levels, and prize structures.
 * Allows editing with choice between store settings or session-specific copy.
 */
export function TournamentInfoTab({ session }: TournamentInfoTabProps) {
  const utils = api.useUtils()

  // Modal states
  const [
    choiceDialogOpened,
    { open: openChoiceDialog, close: closeChoiceDialog },
  ] = useDisclosure(false)
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false)

  // Edit mode tracking
  const [editMode, setEditMode] = useState<TournamentEditMode>('basic')
  const [editChoice, setEditChoice] = useState<EditChoice>('session')

  // Clear override mutation
  const clearOverrides = api.sessionEvent.clearTournamentOverrides.useMutation({
    onSuccess: () => {
      void utils.sessionEvent.getActiveSession.invalidate()
    },
  })

  // Compute merged tournament data
  const tournamentData = useMemo((): SessionTournamentData | null => {
    if (!session.tournament) return null

    const tournament = session.tournament

    // Parse override data from session
    const basicOverride = session.tournamentOverrideBasic as {
      name?: string | null
      buyIn: number
      rake?: number | null
      startingStack?: number | null
      notes?: string | null
    } | null

    const blindsOverride = session.tournamentOverrideBlinds as BlindLevel[] | null
    const prizesOverride = session.tournamentOverridePrizes as PrizeStructure[] | null

    // Merge basic info
    const basic = {
      name: basicOverride?.name !== undefined ? basicOverride.name : tournament.name,
      buyIn: basicOverride?.buyIn ?? tournament.buyIn,
      rake: basicOverride?.rake !== undefined ? basicOverride.rake : tournament.rake,
      startingStack:
        basicOverride?.startingStack !== undefined
          ? basicOverride.startingStack
          : tournament.startingStack,
      notes: basicOverride?.notes !== undefined ? basicOverride.notes : tournament.notes,
    }

    // Convert store blind levels to BlindLevel type
    const storeBlindLevels: BlindLevel[] = tournament.blindLevels.map((bl) => ({
      level: bl.level,
      isBreak: bl.isBreak ?? false,
      smallBlind: bl.smallBlind,
      bigBlind: bl.bigBlind,
      ante: bl.ante,
      durationMinutes: bl.durationMinutes,
    }))

    // Convert store prize structures to PrizeStructure type
    const storePrizeStructures: PrizeStructure[] = tournament.prizeStructures.map(
      (ps, sIdx) => ({
        minEntrants: ps.minEntrants,
        maxEntrants: ps.maxEntrants,
        sortOrder: ps.sortOrder ?? sIdx,
        prizeLevels: ps.prizeLevels.map((pl, lIdx) => ({
          minPosition: pl.minPosition,
          maxPosition: pl.maxPosition,
          sortOrder: pl.sortOrder ?? lIdx,
          prizeItems: pl.prizeItems.map((pi, iIdx) => ({
            prizeType: pi.prizeType as 'percentage' | 'fixed_amount' | 'custom_prize',
            percentage: pi.percentage ? Number(pi.percentage) : null,
            fixedAmount: pi.fixedAmount,
            customPrizeLabel: pi.customPrizeLabel,
            customPrizeValue: pi.customPrizeValue,
            sortOrder: pi.sortOrder ?? iIdx,
          })),
        })),
      }),
    )

    return {
      basic,
      blindLevels: blindsOverride ?? storeBlindLevels,
      prizeStructures: prizesOverride ?? storePrizeStructures,
      hasBasicOverride: basicOverride !== null,
      hasBlindsOverride: blindsOverride !== null,
      hasPrizesOverride: prizesOverride !== null,
    }
  }, [session])

  if (!tournamentData || !session.tournament) {
    return (
      <Text c="dimmed" py="md" ta="center">
        トーナメント情報が見つかりません
      </Text>
    )
  }

  const handleEditClick = (mode: TournamentEditMode) => {
    setEditMode(mode)
    openChoiceDialog()
  }

  const handleChoiceConfirm = (choice: EditChoice) => {
    setEditChoice(choice)
    closeChoiceDialog()
    if (choice === 'session') {
      openEditModal()
    } else {
      // For store edit, navigate to store settings (or show warning)
      // For now, just open modal in store mode
      openEditModal()
    }
  }

  const handleClearOverride = (section: 'basic' | 'blinds' | 'prizes') => {
    clearOverrides.mutate({
      sessionId: session.id,
      clearBasic: section === 'basic',
      clearBlinds: section === 'blinds',
      clearPrizes: section === 'prizes',
    })
  }

  return (
    <ScrollArea style={{ flex: 1 }}>
      <Stack gap="md">
        {/* Basic Info Section */}
        <Card padding="sm" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <Text fw={600} size="sm">
                基本情報
              </Text>
              {tournamentData.hasBasicOverride && (
                <Tooltip label="セッション固有の設定です">
                  <Badge color="blue" size="xs" variant="light">
                    カスタム
                  </Badge>
                </Tooltip>
              )}
            </Group>
            <Group gap={4}>
              {tournamentData.hasBasicOverride && (
                <Tooltip label="ストア設定に戻す">
                  <ActionIcon
                    color="gray"
                    loading={clearOverrides.isPending}
                    onClick={() => handleClearOverride('basic')}
                    size="sm"
                    variant="subtle"
                  >
                    <IconRefresh size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label="編集">
                <ActionIcon
                  onClick={() => handleEditClick('basic')}
                  size="sm"
                  variant="subtle"
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text c="dimmed" size="xs">
                トーナメント名
              </Text>
              <Text size="sm" fw={500}>
                {tournamentData.basic.name || '-'}
              </Text>
            </Box>
            <Box>
              <Text c="dimmed" size="xs">
                バイイン
              </Text>
              <Text size="sm" fw={500}>
                {tournamentData.basic.buyIn.toLocaleString()}
                {tournamentData.basic.rake && (
                  <Text c="dimmed" component="span" size="xs" ml={4}>
                    (レーキ: {tournamentData.basic.rake.toLocaleString()})
                  </Text>
                )}
              </Text>
            </Box>
            <Box>
              <Text c="dimmed" size="xs">
                スターティングスタック
              </Text>
              <Text size="sm" fw={500}>
                {tournamentData.basic.startingStack?.toLocaleString() || '-'}
              </Text>
            </Box>
          </SimpleGrid>

          {tournamentData.basic.notes && (
            <>
              <Divider my="xs" />
              <Text c="dimmed" size="xs" mb={4}>
                メモ
              </Text>
              <TypographyStylesProvider>
                <Box
                  dangerouslySetInnerHTML={{
                    __html: tournamentData.basic.notes,
                  }}
                  style={{ fontSize: 'var(--mantine-font-size-sm)' }}
                />
              </TypographyStylesProvider>
            </>
          )}
        </Card>

        {/* Blind Levels Section */}
        <Card padding="sm" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconClock size={16} />
              <Text fw={600} size="sm">
                ブラインドストラクチャー
              </Text>
              {tournamentData.hasBlindsOverride && (
                <Tooltip label="セッション固有の設定です">
                  <Badge color="blue" size="xs" variant="light">
                    カスタム
                  </Badge>
                </Tooltip>
              )}
            </Group>
            <Group gap={4}>
              {tournamentData.hasBlindsOverride && (
                <Tooltip label="ストア設定に戻す">
                  <ActionIcon
                    color="gray"
                    loading={clearOverrides.isPending}
                    onClick={() => handleClearOverride('blinds')}
                    size="sm"
                    variant="subtle"
                  >
                    <IconRefresh size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label="編集">
                <ActionIcon
                  onClick={() => handleEditClick('blind')}
                  size="sm"
                  variant="subtle"
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <BlindLevelDisplay
            blindLevels={tournamentData.blindLevels}
            maxHeight={200}
          />
        </Card>

        {/* Prize Structure Section */}
        <Card padding="sm" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconChartPie size={16} />
              <Text fw={600} size="sm">
                プライズストラクチャー
              </Text>
              {tournamentData.hasPrizesOverride && (
                <Tooltip label="セッション固有の設定です">
                  <Badge color="blue" size="xs" variant="light">
                    カスタム
                  </Badge>
                </Tooltip>
              )}
            </Group>
            <Group gap={4}>
              {tournamentData.hasPrizesOverride && (
                <Tooltip label="ストア設定に戻す">
                  <ActionIcon
                    color="gray"
                    loading={clearOverrides.isPending}
                    onClick={() => handleClearOverride('prizes')}
                    size="sm"
                    variant="subtle"
                  >
                    <IconRefresh size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label="編集">
                <ActionIcon
                  onClick={() => handleEditClick('prize')}
                  size="sm"
                  variant="subtle"
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <PrizeStructureDisplay
            prizeStructures={tournamentData.prizeStructures}
            maxHeight={200}
          />
        </Card>
      </Stack>

      {/* Edit Choice Dialog */}
      <EditChoiceDialog
        mode={editMode}
        onClose={closeChoiceDialog}
        onConfirm={handleChoiceConfirm}
        opened={choiceDialogOpened}
      />

      {/* Tournament Edit Modal */}
      <TournamentEditModal
        editChoice={editChoice}
        mode={editMode}
        onClose={closeEditModal}
        opened={editModalOpened}
        session={session}
        tournamentData={tournamentData}
      />
    </ScrollArea>
  )
}
