import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface SearchContextValue {
  isOpen: boolean
  initialQuery: string
  open: (query?: string) => void
  close: () => void
  toggle: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')

  const open = useCallback((query?: string) => {
    setInitialQuery(query ?? '')
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((value) => !value), [])

  const value = useMemo<SearchContextValue>(
    () => ({ isOpen, initialQuery, open, close, toggle }),
    [isOpen, initialQuery, open, close, toggle],
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearchController(): SearchContextValue {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearchController 必须在 SearchProvider 内使用')
  return context
}
