'use client'

import { Drawer } from '@mantine/core'
import type { RouterOutputs } from '~/trpc/react'
import { NewSessionForm } from './NewSessionForm'

type StoreWithGames = RouterOutputs['store']['getById']

interface NewSessionDrawerProps {
  stores: StoreWithGames[]
  opened: boolean
  onClose: () => void
}

/**
 * New session drawer component.
 *
 * Bottom sheet drawer containing the new session form.
 */
export function NewSessionDrawer({
  stores,
  opened,
  onClose,
}: NewSessionDrawerProps) {
  return (
    <Drawer
      onClose={onClose}
      opened={opened}
      position="bottom"
      size="auto"
      title="Record Session"
    >
      <NewSessionForm onCancel={onClose} onSuccess={onClose} stores={stores} />
    </Drawer>
  )
}
