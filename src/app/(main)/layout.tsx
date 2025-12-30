import type { ReactNode } from 'react'

import { AppShell } from '~/components/layouts/AppShell'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * Layout for authenticated pages with AppShell navigation.
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return <AppShell>{children}</AppShell>
}
