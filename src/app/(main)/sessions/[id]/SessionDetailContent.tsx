'use client'

import { Button, Container, Group, Modal, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { TimelineAllInRecord } from './timelineGrouping'
import { usePageTitle } from '~/contexts/PageTitleContext'
import {
  createAllInRecord,
  deleteAllInRecord,
  deleteSession,
  updateAllInRecord,
} from '../actions'
import { type AllInFormValues, AllInModal } from './AllInModal'
import { AllInSection } from './AllInSection'
import { EventTimelineSection } from './EventTimelineSection'
import { SessionHeader } from './SessionHeader'
import { SessionInfoCard } from './SessionInfoCard'
import { SessionSummary } from './SessionSummary'
import type { AllInRecord, Session } from './types'

interface SessionDetailContentProps {
  session: Session
}

/**
 * Session detail content client component.
 *
 * Shows session details with profit/loss, all-in records, and EV summary.
 */
export function SessionDetailContent({
  session,
}: SessionDetailContentProps) {
  usePageTitle('セッション詳細')

  const router = useRouter()

  // State for editing all-in record
  const [editingAllIn, setEditingAllIn] = useState<AllInRecord | null>(null)
  const [deletingAllInId, setDeletingAllInId] = useState<string | null>(null)

  // Modal states
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false)
  const [allInModalOpened, { open: openAllInModal, close: closeAllInModal }] =
    useDisclosure(false)
  const [
    deleteAllInModalOpened,
    { open: openDeleteAllInModal, close: closeDeleteAllInModal },
  ] = useDisclosure(false)

  // Transition states
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isSavingAllIn, startSaveAllInTransition] = useTransition()
  const [isDeletingAllIn, startDeleteAllInTransition] = useTransition()

  // Delete session using Server Action
  const handleDelete = () => {
    closeDeleteModal()
    startDeleteTransition(async () => {
      const result = await deleteSession({ id: session.id })

      if (result.success) {
        notifications.show({
          title: '削除完了',
          message: 'セッションを削除しました',
          color: 'green',
        })
        router.push('/sessions')
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  // Open all-in modal for create
  const openAllInForCreate = () => {
    setEditingAllIn(null)
    openAllInModal()
  }

  // Open all-in modal for edit
  const openAllInForEdit = (record: AllInRecord) => {
    setEditingAllIn(record)
    openAllInModal()
  }

  // Handle edit all-in from timeline (finds full record by id)
  const handleEditAllIn = (timelineAllIn: TimelineAllInRecord) => {
    const fullRecord = session.allInRecords.find(
      (r) => r.id === timelineAllIn.id,
    )
    if (fullRecord) {
      openAllInForEdit(fullRecord)
    }
  }

  // Handle all-in form submit
  const handleAllInSubmit = (values: AllInFormValues) => {
    const winProbabilityNum = Number.parseFloat(values.winProbability)
    startSaveAllInTransition(async () => {
      if (editingAllIn) {
        // Update existing record
        const result = await updateAllInRecord({
          id: editingAllIn.id,
          potAmount: values.potAmount,
          winProbability: winProbabilityNum,
          actualResult: values.useRunIt
            ? (values.winsInRunout ?? 0) > 0
            : values.actualResult === 'win',
          runItTimes: values.useRunIt ? values.runItTimes : null,
          winsInRunout: values.useRunIt ? values.winsInRunout : null,
        })

        if (result.success) {
          notifications.show({
            title: '更新完了',
            message: 'オールイン記録を更新しました',
            color: 'green',
          })
          closeAllInModal()
          setEditingAllIn(null)
          router.refresh()
        } else {
          notifications.show({
            title: 'エラー',
            message: result.error,
            color: 'red',
          })
        }
      } else {
        // Create new record
        const result = await createAllInRecord({
          sessionId: session.id,
          potAmount: values.potAmount,
          winProbability: winProbabilityNum,
          actualResult: values.useRunIt
            ? (values.winsInRunout ?? 0) > 0
            : values.actualResult === 'win',
          runItTimes: values.useRunIt ? values.runItTimes : null,
          winsInRunout: values.useRunIt ? values.winsInRunout : null,
        })

        if (result.success) {
          notifications.show({
            title: '作成完了',
            message: 'オールイン記録を追加しました',
            color: 'green',
          })
          closeAllInModal()
          router.refresh()
        } else {
          notifications.show({
            title: 'エラー',
            message: result.error,
            color: 'red',
          })
        }
      }
    })
  }

  // Handle all-in delete click (for AllInSection)
  const handleAllInDeleteClick = (recordId: string) => {
    setDeletingAllInId(recordId)
    openDeleteAllInModal()
  }

  // Handle all-in delete
  const handleAllInDelete = () => {
    if (!deletingAllInId) return
    closeDeleteAllInModal()
    startDeleteAllInTransition(async () => {
      const result = await deleteAllInRecord({ id: deletingAllInId })

      if (result.success) {
        notifications.show({
          title: '削除完了',
          message: 'オールイン記録を削除しました',
          color: 'green',
        })
        setDeletingAllInId(null)
        router.refresh()
      } else {
        notifications.show({
          title: 'エラー',
          message: result.error,
          color: 'red',
        })
      }
    })
  }

  const handleAllInModalClose = () => {
    closeAllInModal()
    setEditingAllIn(null)
  }

  return (
    <Container py="md" size="sm">
      <Stack gap="md">
        {/* Header */}
        <SessionHeader
          gameType={session.gameType}
          onDeleteClick={openDeleteModal}
          sessionId={session.id}
        />

        {/* Profit/Loss Summary with optional chart */}
        <SessionSummary session={session} />

        {/* Session Info */}
        <SessionInfoCard session={session} />

        {/* All-In Records */}
        <AllInSection
          allInRecords={session.allInRecords}
          onAddClick={openAllInForCreate}
          onDeleteClick={handleAllInDeleteClick}
          onEditClick={openAllInForEdit}
        />

        {/* Event Timeline (only for live-recorded sessions) */}
        {session.sessionEvents.length > 0 && (
          <EventTimelineSection
            allInRecords={session.allInRecords}
            events={session.sessionEvents}
            onEditAllIn={handleEditAllIn}
            sessionId={session.id}
          />
        )}
      </Stack>

      {/* Delete Session Confirmation Modal */}
      <Modal
        centered
        onClose={closeDeleteModal}
        opened={deleteModalOpened}
        title="セッションの削除"
      >
        <Stack>
          <Text>このセッションを削除しますか？この操作は取り消せません。</Text>
          <Group justify="flex-end">
            <Button onClick={closeDeleteModal} variant="subtle">
              キャンセル
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleDelete}>
              削除を確認
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* All-In Record Modal (Create/Edit) */}
      <AllInModal
        editingAllIn={editingAllIn}
        isLoading={isSavingAllIn}
        onClose={handleAllInModalClose}
        onSubmit={handleAllInSubmit}
        opened={allInModalOpened}
      />

      {/* Delete All-In Record Confirmation Modal */}
      <Modal
        centered
        onClose={closeDeleteAllInModal}
        opened={deleteAllInModalOpened}
        title="オールイン記録の削除"
      >
        <Stack>
          <Text>このオールイン記録を削除しますか？</Text>
          <Group justify="flex-end">
            <Button onClick={closeDeleteAllInModal} variant="subtle">
              キャンセル
            </Button>
            <Button
              color="red"
              loading={isDeletingAllIn}
              onClick={handleAllInDelete}
            >
              削除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
