'use client'

import {
  Button,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Title,
  TypographyStylesProvider,
} from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'

import type { ChangelogEntry } from '~/lib/version'

interface UpdateNotificationModalProps {
  opened: boolean
  onClose: () => void
  latestVersion: string
  changelogs: ChangelogEntry[]
  onUpdate: () => void
}

/**
 * Modal component for displaying PWA update notifications.
 * Shows version number and changelog content in Japanese.
 * Supports displaying multiple version changelogs when user has missed updates.
 */
export function UpdateNotificationModal({
  opened,
  onClose,
  latestVersion,
  changelogs,
  onUpdate,
}: UpdateNotificationModalProps) {
  if (changelogs.length === 0) return null

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
          バージョン {latestVersion} が利用可能です
        </Title>

        <Text c="dimmed" fw={500} size="sm">
          更新内容:
        </Text>

        <ScrollArea.Autosize mah={300}>
          <Stack gap="md">
            {changelogs.map((entry, index) => (
              <Stack key={entry.version} gap="xs">
                {/* Show version header for multiple changelogs */}
                {changelogs.length > 1 && (
                  <Text fw={600} size="sm">
                    v{entry.version}
                    {entry.date && (
                      <Text c="dimmed" component="span" ml="xs" size="xs">
                        ({entry.date})
                      </Text>
                    )}
                  </Text>
                )}
                <TypographyStylesProvider>
                  <div
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe - content is from our CHANGELOG.md
                    dangerouslySetInnerHTML={{
                      __html: formatChangelog(entry.content),
                    }}
                  />
                </TypographyStylesProvider>
                {index < changelogs.length - 1 && <Divider />}
              </Stack>
            ))}
          </Stack>
        </ScrollArea.Autosize>

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
