'use client'

import { ActionIcon, Affix } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

interface PlayerFABProps {
  onOpen: () => void
}

/**
 * Floating action button for adding new player.
 */
export function PlayerFAB({ onOpen }: PlayerFABProps) {
  return (
    <Affix position={{ bottom: 24, right: 24 }} zIndex={100}>
      <ActionIcon
        aria-label="Add new player"
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
