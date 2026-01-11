'use client'

import { useDisclosure } from '@mantine/hooks'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  fetchVersionInfo,
  getStoredVersion,
  isNewerVersion,
  storeVersion,
  VERSION_CHECK_INTERVAL,
  type VersionInfo,
} from '~/lib/version'
import { UpdateNotificationModal } from './UpdateNotificationModal'

/**
 * Service Worker Registration Component
 *
 * Registers the service worker and handles PWA update notifications.
 * Periodically checks for new versions and displays update modal when available.
 */
export function ServiceWorkerRegistration() {
  const [
    updateModalOpened,
    { open: openUpdateModal, close: closeUpdateModal },
  ] = useDisclosure(false)
  const [pendingVersionInfo, setPendingVersionInfo] =
    useState<VersionInfo | null>(null)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Check for new version and show notification if available
   */
  const checkForUpdates = useCallback(async () => {
    const versionInfo = await fetchVersionInfo()
    if (!versionInfo) return

    const storedVersion = getStoredVersion()

    // First time user - store version without showing modal
    if (!storedVersion) {
      storeVersion(versionInfo.version)
      return
    }

    // Check if there's a newer version
    if (isNewerVersion(storedVersion, versionInfo.version)) {
      setPendingVersionInfo(versionInfo)
      openUpdateModal()
    }
  }, [openUpdateModal])

  /**
   * Handle the update action - refresh service worker and reload page
   */
  const handleUpdate = useCallback(() => {
    // Store the new version
    if (pendingVersionInfo) {
      storeVersion(pendingVersionInfo.version)
    }

    // Close the modal
    closeUpdateModal()

    // Tell the waiting service worker to activate
    const registration = registrationRef.current
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }

    // Reload the page to get the new version
    window.location.reload()
  }, [pendingVersionInfo, closeUpdateModal])

  /**
   * Handle "Later" action - store version to not show again
   */
  const handleDismiss = useCallback(() => {
    // Store version so we don't show the same notification again
    if (pendingVersionInfo) {
      storeVersion(pendingVersionInfo.version)
    }
    closeUpdateModal()
  }, [pendingVersionInfo, closeUpdateModal])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Disable service worker in development
    if (process.env.NODE_ENV === 'development') return

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })
        registrationRef.current = registration

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker installed - check version
              checkForUpdates()
            }
          })
        })

        // Handle controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // New service worker activated - page will reload
        })

        // Initial version check
        checkForUpdates()

        // Set up periodic version checks
        checkIntervalRef.current = setInterval(
          checkForUpdates,
          VERSION_CHECK_INTERVAL
        )
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    registerSW()

    // Cleanup interval on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [checkForUpdates])

  return (
    <UpdateNotificationModal
      onClose={handleDismiss}
      onUpdate={handleUpdate}
      opened={updateModalOpened}
      versionInfo={pendingVersionInfo}
    />
  )
}
