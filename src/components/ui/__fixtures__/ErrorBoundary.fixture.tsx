'use client'

import { Stack } from '@mantine/core'
import { ErrorDisplay } from '../ErrorBoundary'

/**
 * Fixture for ErrorDisplay component.
 *
 * Note: ErrorBoundary is a class component that catches errors,
 * so we demo ErrorDisplay which is the visual part.
 */
export default {
  Default: (
    <Stack p="md">
      <ErrorDisplay />
    </Stack>
  ),

  CustomMessage: (
    <Stack p="md">
      <ErrorDisplay
        message="データの読み込みに失敗しました。ネットワーク接続を確認してください。"
        title="読み込みエラー"
      />
    </Stack>
  ),

  WithRetry: (
    <Stack p="md">
      <ErrorDisplay
        message="もう一度お試しください。"
        onRetry={() => alert('再試行がクリックされました')}
        title="処理に失敗しました"
      />
    </Stack>
  ),
}
