'use client'

import { Paper, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { RichTextEditor } from '../RichTextEditor'

/**
 * Fixture for RichTextEditor component.
 */
function RichTextEditorDemo() {
  const [content, setContent] = useState('<p>初期テキスト</p>')

  return (
    <Stack p="md">
      <Text size="sm">リッチテキストエディタ:</Text>
      <RichTextEditor content={content} onChange={setContent} />
      <Paper bg="gray.1" p="md" withBorder>
        <Text fw={500} size="xs">
          HTML出力:
        </Text>
        <Text c="dimmed" size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {content}
        </Text>
      </Paper>
    </Stack>
  )
}

export default {
  Default: <RichTextEditorDemo />,
}
