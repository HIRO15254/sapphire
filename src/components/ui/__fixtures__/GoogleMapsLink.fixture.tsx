'use client'

import { Stack, Text } from '@mantine/core'
import { GoogleMapsLink } from '../GoogleMapsLink'

/**
 * Fixture for GoogleMapsLink component.
 */
export default {
  Default: (
    <Stack p="md">
      <Text size="sm">デフォルト:</Text>
      <GoogleMapsLink url="https://maps.google.com/?q=Tokyo" />
    </Stack>
  ),

  CustomLabel: (
    <Stack p="md">
      <Text size="sm">カスタムラベル:</Text>
      <GoogleMapsLink label="店舗の場所を見る" url="https://maps.google.com/?q=Shibuya" />
    </Stack>
  ),

  SizeVariants: (
    <Stack p="md">
      <Text size="sm">サイズバリエーション:</Text>
      <GoogleMapsLink size="xs" url="https://maps.google.com/?q=Tokyo" />
      <GoogleMapsLink size="sm" url="https://maps.google.com/?q=Tokyo" />
      <GoogleMapsLink size="md" url="https://maps.google.com/?q=Tokyo" />
      <GoogleMapsLink size="lg" url="https://maps.google.com/?q=Tokyo" />
    </Stack>
  ),

  NullUrl: (
    <Stack p="md">
      <Text size="sm">URL が null の場合（何も表示されない）:</Text>
      <GoogleMapsLink url={null} />
      <Text c="dimmed" size="xs">
        ↑ 上に何も表示されていないことを確認
      </Text>
    </Stack>
  ),
}
