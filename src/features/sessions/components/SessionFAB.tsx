'use client'

import { ActionIcon, Affix } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

interface SessionFABProps {
  onOpen: () => void
}

/**
 * Floating action button for adding new session.
 */
export function SessionFAB({ onOpen }: SessionFABProps) {
  return (
    <Affix position={{ bottom: 24, right: 24 }} zIndex={100}>
      <ActionIcon
        aria-label="Record new session"
        color="blue"
        onClick={onOpen}
        radius="xl"
        size={56}
        variant="filled"
      >
        <IconPlus size={28} />
      </ActionIcon>
    </Affix>
  )
}
