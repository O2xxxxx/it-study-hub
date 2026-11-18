import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
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

export interface ScrollMemory {
  path: string
  scrollY: number
}

/** 进入详情前记录列表页滚动位置，返回时由 useRestoreScroll 还原。 */
export function rememberScroll(path: string) {
  try {
    const memory: ScrollMemory = { path, scrollY: window.scrollY }
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(memory))
  } catch {
    /* sessionStorage 不可用时静默忽略 */
  }
}

export function useRestoreScroll(path: string, ready = true) {
  useLayoutEffect(() => {
    if (!ready) return
    let saved: ScrollMemory | null = null
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY)
      if (raw) saved = JSON.parse(raw) as ScrollMemory
    } catch {
      saved = null
    }
    if (!saved || saved.path !== path || saved.scrollY <= 0) return
    const targetY = saved.scrollY
    try {
      sessionStorage.removeItem(SCROLL_KEY)
    } catch {
      /* ignore */
    }
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, behavior: 'auto' })
    })
    return () => cancelAnimationFrame(raf)
  }, [path, ready])
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
