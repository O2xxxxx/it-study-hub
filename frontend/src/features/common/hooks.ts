import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Location, NavigationType } from 'react-router-dom'
import { useIsPresent } from 'motion/react'
import { ApiError } from '@/lib/api'

export function errorMessage(error: unknown, fallback = '加载失败，请稍后重试'): string {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
  setData: Dispatch<SetStateAction<T | null>>
}

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    loaderRef.current()
      .then((next) => {
        if (alive) setData(next)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setError(errorMessage(err))
        setData(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, loading, error, reload, setData }
}

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? title + ' · IT 学习天地' : 'IT 学习天地'
  }, [title])
}

const SCROLL_KEY = 'its-study:scroll-memory'

interface ScrollMemory {
  path: string
  scrollY: number
}

/** 记录列表滚动位置，供详情页的返回链接使用。 */
export function rememberScroll(path: string) {
  try {
    const memory: ScrollMemory = { path, scrollY: window.scrollY }
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(memory))
  } catch {
    /* sessionStorage 不可用时静默忽略 */
  }
}

function readScrollMemory(path: string) {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY)
    const saved: ScrollMemory | null = raw ? JSON.parse(raw) : null
    return saved?.path === path && Number.isFinite(saved.scrollY) && saved.scrollY >= 0 ? saved : null
  } catch {
    return null
  }
}

export function useRouteScroll(location: Location, navigationType: NavigationType, positions: Map<string, number>) {
  const isPresent = useIsPresent()
  const activeKey = useRef(location.key)
  const cancelRestore = useRef<(() => void) | null>(null)
  const [entry] = useState(() => {
    const saved = readScrollMemory(location.pathname + location.search)
    const historyY = navigationType === 'POP' ? positions.get(location.key) : undefined
    return { saved, top: historyY ?? saved?.scrollY ?? (location.hash ? null : 0) }
  })

  useLayoutEffect(() => {
    const root = document.scrollingElement
    let observer: ResizeObserver | undefined
    function cancelPendingScroll() {
      observer?.disconnect()
      window.removeEventListener('scroll', handleScroll)
      cancelRestore.current = null
    }
    function handleScroll() {
      if (window.scrollY !== 0) cancelPendingScroll()
    }

    if (entry.saved) {
      try {
        sessionStorage.removeItem(SCROLL_KEY)
      } catch {
        /* sessionStorage 不可用时静默忽略 */
      }
    }

    const top = entry.top
    if (top !== null) {
      if (root && root.scrollHeight - root.clientHeight < top) {
        // Wait for async page content to make the saved position reachable.
        window.scrollTo({ top: 0, behavior: 'instant' })
        observer = new ResizeObserver(() => {
          if (root.scrollHeight - root.clientHeight < top) return
          cancelPendingScroll()
          window.scrollTo({ top, behavior: 'instant' })
        })
        observer.observe(document.body)
        window.addEventListener('scroll', handleScroll)
        cancelRestore.current = cancelPendingScroll
      } else {
        window.scrollTo({ top, behavior: 'instant' })
      }
    }

    return () => {
      positions.set(activeKey.current, window.scrollY)
      cancelRestore.current?.()
    }
  }, [entry, positions])

  useLayoutEffect(() => {
    if (!isPresent || activeKey.current !== location.key) cancelRestore.current?.()
    if (activeKey.current === location.key) return
    positions.set(activeKey.current, window.scrollY)
    activeKey.current = location.key
  }, [isPresent, location.key, positions])
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
