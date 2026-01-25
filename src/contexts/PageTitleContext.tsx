'use client'

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

interface PageTitleContextValue {
  title: string
  setTitle: (title: string) => void
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null)

interface PageTitleProviderProps {
  children: ReactNode
}

/**
 * Provider for page title context.
 * Wrap your app with this provider to enable dynamic page titles.
 */
export function PageTitleProvider({ children }: PageTitleProviderProps) {
  const [title, setTitle] = useState('')

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

/**
 * Hook to set the page title from a page component.
 * The title will be cleared when the component unmounts.
 */
export function usePageTitle(title: string) {
  const context = useContext(PageTitleContext)

  useEffect(() => {
    context?.setTitle(title)
    return () => context?.setTitle('')
  }, [title, context])
}

/**
 * Hook to get the current page title value.
 * Used by AppShell to display the title in the header.
 */
export function usePageTitleValue(): string {
  const context = useContext(PageTitleContext)
  return context?.title ?? ''
}
