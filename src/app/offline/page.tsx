import type { Metadata } from 'next'
import { OfflineContent } from './OfflineContent'

export const metadata: Metadata = {
  title: 'オフライン - Sapphire',
  description: 'ネットワーク接続がありません',
}

export default function OfflinePage() {
  return <OfflineContent />
}
