'use client'

import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  TypographyStylesProvider,
} from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'

import type { VersionInfo } from '~/lib/version'

interface UpdateNotificationModalProps {
  opened: boolean
  onClose: () => void
  versionInfo: VersionInfo | null
  onUpdate: () => void
}

/**
 * Modal component for displaying PWA update notifications.
 * Shows version number and changelog content in Japanese.
 */
export function UpdateNotificationModal({
  opened,
  onClose,
  versionInfo,
  onUpdate,
}: UpdateNotificationModalProps) {
  if (!versionInfo) return null

  return (
    <Modal
      centered
      onClose={onClose}
      opened={opened}
      size="md"
      title={
        <Group gap="xs">
          <IconRefresh size={20} />
          <Text fw={600}>アップデートのお知らせ</Text>
        </Group>
      }
    >
      <Stack>
        <Title order={4}>
          バージョン {versionInfo.version} が利用可能です
        </Title>

        {versionInfo.changelog && (
          <Stack gap="xs">
            <Text c="dimmed" fw={500} size="sm">
              更新内容:
            </Text>
            <TypographyStylesProvider>
              <div
                // Convert markdown-style changelog to simple HTML
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe - content is from our CHANGELOG.md
                dangerouslySetInnerHTML={{
                  __html: formatChangelog(versionInfo.changelog),
                }}
              />
            </TypographyStylesProvider>
          </Stack>
        )}

        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="subtle">
            後で
          </Button>
          <Button leftSection={<IconRefresh size={16} />} onClick={onUpdate}>
            今すぐ更新
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

/**
 * Convert markdown changelog to simple HTML for display
 */
function formatChangelog(changelog: string): string {
  return (
    changelog
      // Convert ### headings to bold
      .replace(/^### (.+)$/gm, '<strong>$1</strong>')
      // Convert - items to list items
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Wrap consecutive list items in ul
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      // Convert newlines to breaks (outside of lists)
      .replace(/\n(?!<)/g, '<br />')
  )
}
