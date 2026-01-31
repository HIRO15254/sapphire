'use client'

import {
  Button,
  Card,
  Collapse,
  Container,
  Group,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconChevronDown,
  IconChevronUp,
  IconHistory,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  SessionEventTimeline,
  type TimelineAllInRecord,
} from '~/components/sessions/SessionEventTimeline'
import { usePageTitle } from '~/contexts/PageTitleContext'
import {
  createAllInRecord,
  deleteAllInRecord,
  deleteSession,
  updateAllInRecord,
} from '../actions'
import { type AllInFormValues, AllInModal } from '~/components/sessions/AllInModal'
import { AllInSection } from './AllInSection'
import { SessionEditDrawer } from './SessionEditDrawer'
import { SessionHeader } from './SessionHeader'
import { SessionInfoCard } from './SessionInfoCard'
import { SessionSummary } from './SessionSummary'
import type { AllInRecord, Session } from './types'

interface SessionDetailContentProps {
  session: Session
  stores: Array<{
    id: string
    name: string
  }>
}

export function SessionDetailContent({
  session,
  stores,
}: SessionDetailContentProps) {
  usePageTitle('Session Details')

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
  const [editDrawerOpened, { open: openEditDrawer, close: closeEditDrawer }] =
    useDisclosure(false)

  // Timeline collapse state
  const [timelineOpened, setTimelineOpened] = useState(false)

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
          title: 'Deleted',
          message: 'Session has been deleted',
          color: 'green',
        })
        router.push('/sessions')
      } else {
        notifications.show({
          title: 'Error',
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

  // Handle edit all-in from timeline
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
            title: 'Updated',
            message: 'All-in record updated',
            color: 'green',
          })
          closeAllInModal()
          setEditingAllIn(null)
          router.refresh()
        } else {
          notifications.show({
            title: 'Error',
            message: result.error,
            color: 'red',
          })
        }
      } else {
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
            title: 'Created',
            message: 'All-in record added',
            color: 'green',
          })
          closeAllInModal()
          router.refresh()
        } else {
          notifications.show({
            title: 'Error',
            message: result.error,
            color: 'red',
          })
        }
      }
    })
  }

  // Handle all-in delete click
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
          title: 'Deleted',
          message: 'All-in record deleted',
          color: 'green',
        })
        setDeletingAllInId(null)
        router.refresh()
      } else {
        notifications.show({
          title: 'Error',
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
          onEditClick={openEditDrawer}
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
          <Card radius="sm" shadow="xs" withBorder>
            <UnstyledButton
              onClick={() => setTimelineOpened((o) => !o)}
              style={{ width: '100%' }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs">
                  <IconHistory size={18} />
                  <Text fw={500}>Event History</Text>
                </Group>
                {timelineOpened ? (
                  <IconChevronUp size={18} />
                ) : (
                  <IconChevronDown size={18} />
                )}
              </Group>
            </UnstyledButton>
            <Collapse in={timelineOpened}>
              <Stack gap="md" mt="md">
                <SessionEventTimeline
                  allInRecords={session.allInRecords}
                  events={session.sessionEvents}
                  onEditAllIn={handleEditAllIn}
                  sessionId={session.id}
                />
              </Stack>
            </Collapse>
          </Card>
        )}
      </Stack>

      {/* Delete Session Confirmation Modal */}
      <Modal
        centered
        onClose={closeDeleteModal}
        opened={deleteModalOpened}
        title="Delete Session"
      >
        <Stack>
          <Text>
            Are you sure you want to delete this session? This action cannot be
            undone.
          </Text>
          <Group justify="flex-end">
            <Button onClick={closeDeleteModal} variant="subtle">
              Cancel
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleDelete}>
              Confirm Delete
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
        title="Delete All-In Record"
      >
        <Stack>
          <Text>Are you sure you want to delete this all-in record?</Text>
          <Group justify="flex-end">
            <Button onClick={closeDeleteAllInModal} variant="subtle">
              Cancel
            </Button>
            <Button
              color="red"
              loading={isDeletingAllIn}
              onClick={handleAllInDelete}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Session Edit Drawer (Bottom Sheet) */}
      <SessionEditDrawer
        onClose={closeEditDrawer}
        opened={editDrawerOpened}
        session={session}
        stores={stores}
      />
    </Container>
  )
}
