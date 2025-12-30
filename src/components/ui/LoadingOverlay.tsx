'use client'

import { LoadingOverlay as MantineLoadingOverlay } from '@mantine/core'

interface LoadingOverlayProps {
  visible: boolean
}

/**
 * Loading overlay wrapper component.
 * Displays a centered loading indicator.
 */
export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  return (
    <MantineLoadingOverlay
      loaderProps={{ type: 'dots' }}
      overlayProps={{ radius: 'sm', blur: 2 }}
      visible={visible}
      zIndex={1000}
    />
  )
}

/**
 * Full-screen loading overlay for page transitions.
 */
export function PageLoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <MantineLoadingOverlay
      loaderProps={{ type: 'bars', size: 'xl' }}
      overlayProps={{ blur: 2 }}
      visible={visible}
      zIndex={9999}
    />
  )
}
