'use client'

import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
} from '@mantine/core'
import { IconCopy, IconDatabase } from '@tabler/icons-react'

import type { EditChoice, TournamentEditMode } from './types'

interface EditChoiceDialogProps {
  opened: boolean
  onClose: () => void
  mode: TournamentEditMode
  onConfirm: (choice: EditChoice) => void
}

const modeLabels: Record<TournamentEditMode, string> = {
  basic: '基本情報',
  blind: 'ブラインドストラクチャー',
  prize: 'プライズストラクチャー',
}

/**
 * Dialog for choosing between editing store settings or creating session-specific copy.
 */
export function EditChoiceDialog({
  opened,
  onClose,
  mode,
  onConfirm,
}: EditChoiceDialogProps) {
  return (
    <Modal
      centered
      onClose={onClose}
      opened={opened}
      size="sm"
      title="編集方法を選択"
    >
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          {modeLabels[mode]}の編集方法を選択してください。
        </Text>

        <Stack gap="xs">
          <Button
            fullWidth
            justify="flex-start"
            leftSection={<IconCopy size={18} />}
            onClick={() => onConfirm('session')}
            variant="light"
          >
            <Stack gap={0} align="flex-start">
              <Text size="sm" fw={500}>
                このセッション用にコピー
              </Text>
              <Text size="xs" c="dimmed">
                このセッションのみに反映されます
              </Text>
            </Stack>
          </Button>

          <Button
            color="orange"
            fullWidth
            justify="flex-start"
            leftSection={<IconDatabase size={18} />}
            onClick={() => onConfirm('store')}
            variant="light"
          >
            <Stack gap={0} align="flex-start">
              <Text size="sm" fw={500}>
                ストア設定を編集
              </Text>
              <Text size="xs" c="dimmed">
                すべてのセッションに反映されます
              </Text>
            </Stack>
          </Button>
        </Stack>

        <Group justify="flex-end">
          <Button onClick={onClose} variant="subtle">
            キャンセル
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
