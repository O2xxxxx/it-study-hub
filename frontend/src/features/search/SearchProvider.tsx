import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface SearchContextValue {
  isOpen: boolean
  initialQuery: string
  open: (query?: string) => void
  close: () => void
  restoreFocus: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')
  const trigger = useRef<HTMLElement | null>(null)

  const open = useCallback((query?: string) => {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setInitialQuery(query ?? '')
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])
  const restoreFocus = useCallback(() => {
    if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true })
  }, [])

  const value = useMemo<SearchContextValue>(
    () => ({ isOpen, initialQuery, open, close, restoreFocus }),
    [isOpen, initialQuery, open, close, restoreFocus],
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearchController(): SearchContextValue {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearchController 必须在 SearchProvider 内使用')
  return context
}
