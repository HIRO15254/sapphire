'use client'

import { Badge, type BadgeProps } from '@mantine/core'
import type { TagOption } from '../lib/types'

interface PlayerTagBadgeProps extends Omit<BadgeProps, 'color' | 'children'> {
  tag: TagOption
}

/**
 * Shared player tag badge component.
 *
 * Provides consistent tag display across all player views
 * (list cards, filter badges, tag management).
 */
export function PlayerTagBadge({
  tag,
  size = 'sm',
  variant = 'light',
  ...rest
}: PlayerTagBadgeProps) {
  return (
    <Badge
      color={tag.color ?? 'gray'}
      size={size}
      variant={variant}
      {...rest}
    >
      {tag.name}
    </Badge>
  )
}
