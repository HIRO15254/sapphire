'use client'

import { ActionIcon, Affix } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

interface CurrencyFABProps {
  onOpen: () => void
}

export function CurrencyFAB({ onOpen }: CurrencyFABProps) {
  return (
    <Affix position={{ bottom: 24, right: 24 }} zIndex={100}>
      <ActionIcon
        aria-label="Add new currency"
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
