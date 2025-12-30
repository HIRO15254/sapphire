'use client'

import { Card, Divider, Group, Stack, Text } from '@mantine/core'

import { GoogleMapsLink } from '~/components/ui/GoogleMapsLink'
import { RichTextContent } from '~/components/ui/RichTextContext'

interface StoreInfoProps {
  address?: string | null
  googleMapsUrl?: string | null
  notes?: string | null
}

export function StoreInfo({ address, googleMapsUrl, notes }: StoreInfoProps) {
  return (
    <Card p="lg" radius="md" shadow="sm" withBorder>
      <Stack gap="md">
        {address && (
          <Group justify="space-between">
            <Text c="dimmed">住所</Text>
            <Text>{address}</Text>
          </Group>
        )}
        {googleMapsUrl && (
          <Group justify="space-between">
            <Text c="dimmed">地図</Text>
            <GoogleMapsLink url={googleMapsUrl} />
          </Group>
        )}
        {notes && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text c="dimmed" size="sm">
                メモ
              </Text>
              <RichTextContent content={notes} />
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  )
}
