'use client'

import { Anchor, Group } from '@mantine/core'
import { IconExternalLink, IconMapPin } from '@tabler/icons-react'

interface GoogleMapsLinkProps {
  /**
   * The Google Maps URL to link to
   */
  url: string | null
  /**
   * Optional text to display (defaults to "地図を開く")
   */
  label?: string
  /**
   * Optional size for the component
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

/**
 * A link component to open Google Maps in a new tab.
 *
 * Displays nothing if url is null.
 */
export function GoogleMapsLink({
  url,
  label = '地図を開く',
  size = 'sm',
}: GoogleMapsLinkProps) {
  if (!url) {
    return null
  }

  return (
    <Anchor
      c="blue"
      href={url}
      rel="noopener noreferrer"
      size={size}
      target="_blank"
    >
      <Group gap={4}>
        <IconMapPin size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
        {label}
        <IconExternalLink size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />
      </Group>
    </Anchor>
  )
}
