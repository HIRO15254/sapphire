import { notFound } from 'next/navigation'

import { api } from '~/trpc/server'

import { SessionDetailContent } from './SessionDetailContent'

// Force dynamic rendering as this page requires authentication
export const dynamic = 'force-dynamic'

interface SessionDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Session detail page (Server Component).
 *
 * Fetches session data on the server and passes to client component via props.
 */
export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params

  try {
    const session = await api.session.getById({ id })

    return <SessionDetailContent session={session} />
  } catch {
    notFound()
  }
}
