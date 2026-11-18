import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError } from '@/lib/api'
import type { User } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  authenticated: boolean
  points: number
  refresh: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, nickname: string) => Promise<void>
  logout: () => Promise<void>
  patchUser: (patch: Partial<User>) => void
  setBalance: (balance: number) => void
  applyPointsDelta: (delta: number, balance?: number) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const state = await api.me()
      if (!mounted.current) return
      setUser(state.authenticated && state.user ? state.user : null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password)
    setUser(res.user)
  }, [])

  const register = useCallback(async (username: string, password: string, nickname: string) => {
    const res = await api.register(username, password, nickname)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    try { await api.logout() } finally { setUser(null) }
  }, [])

  const patchUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const setBalance = useCallback((balance: number) => {
    setUser((prev) => (prev ? { ...prev, points: balance } : prev))
  }, [])

  const applyPointsDelta = useCallback((delta: number, balance?: number) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = typeof balance === 'number' ? balance : Math.max(0, prev.points + delta)
      return { ...prev, points: next }
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    authenticated: !!user,
    points: user?.points ?? 0,
    refresh,
    login,
    register,
    logout,
    patchUser,
    setBalance,
    applyPointsDelta,
  }), [user, loading, refresh, login, register, logout, patchUser, setBalance, applyPointsDelta])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
