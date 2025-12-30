import { Alert, Button, Container } from '@mantine/core'
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react'
import Link from 'next/link'

/**
 * Currency not found page.
 *
 * Displayed when currency ID doesn't exist or user lacks access.
 */
export default function CurrencyNotFound() {
  return (
    <Container py="xl" size="md">
      <Alert
        color="yellow"
        icon={<IconAlertCircle size={16} />}
        title="通貨が見つかりません"
      >
        指定された通貨は存在しないか、アクセスする権限がありません。
      </Alert>
      <Button
        component={Link}
        href="/currencies"
        leftSection={<IconArrowLeft size={16} />}
        mt="lg"
        variant="subtle"
      >
        通貨一覧に戻る
      </Button>
    </Container>
  )
}
