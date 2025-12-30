'use client'

import { Box, Text } from '@mantine/core'
import { LoadingOverlay, PageLoadingOverlay } from '../LoadingOverlay'

/**
 * Fixture for LoadingOverlay components.
 */
export default {
  Default: (
    <Box h={200} pos="relative" w={400}>
      <Text p="md">背景コンテンツ</Text>
      <LoadingOverlay visible />
    </Box>
  ),

  Hidden: (
    <Box h={200} pos="relative" w={400}>
      <Text p="md">背景コンテンツ（オーバーレイ非表示）</Text>
      <LoadingOverlay visible={false} />
    </Box>
  ),

  PageLoading: (
    <Box h={300} pos="relative" w="100%">
      <Text p="md">ページ全体のローディング</Text>
      <PageLoadingOverlay visible />
    </Box>
  ),
}
