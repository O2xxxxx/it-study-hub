import { createContext, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage } from '@/features/common/hooks'
import { api } from '@/lib/api'
import type { LikeResult, PostType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LikeEntry extends LikeResult {
  pending: boolean
}

const LikeContext = createContext<{
  entries: Record<string, LikeEntry>
  update: (type: PostType, id: number, previous: LikeResult) => Promise<void>
} | null>(null)

export function LikeProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, LikeEntry>>({})
  const pending = useRef(new Set<string>())

  async function update(type: PostType, id: number, previous: LikeResult) {
    const key = type + ':' + id
    if (pending.current.has(key)) return
    const liked = !previous.liked
    pending.current.add(key)
    setEntries(current => ({
      ...current,
      [key]: { pending: true, liked, count: Math.max(0, previous.count + (liked ? 1 : -1)) },
    }))
    try {
      const result = await api.likePost(type, id, liked)
      setEntries(current => ({ ...current, [key]: { ...result, pending: false } }))
    } catch (error) {
      setEntries(current => ({ ...current, [key]: { ...previous, pending: false } }))
      toast.error(errorMessage(error, '点赞更新失败'))
    } finally {
      pending.current.delete(key)
    }
  }

  return <LikeContext.Provider value={{ entries, update }}>{children}</LikeContext.Provider>
}

interface LikeButtonProps {
  type: PostType
  id: number
  count: number
  liked: boolean
}

export function LikeButton({ type, id, count, liked }: LikeButtonProps) {
  const context = useContext(LikeContext)
  const { authenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  if (!context) throw new Error('LikeButton 需要 LikeProvider')
  const state = context.entries[type + ':' + id] ?? { liked, count, pending: false }
  const label = state.liked ? '取消点赞' : '点赞'

  function click() {
    if (!authenticated) {
      navigate('/login?redirect=' + encodeURIComponent(location.pathname + location.search))
      return
    }
    if (!state.pending) void context?.update(type, id, state)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="relative z-10 h-8 shrink-0 gap-1.5 px-2 leading-none"
          aria-label={label} aria-pressed={state.liked} aria-disabled={state.pending} onClick={click}>
          <Heart className={cn('size-4', state.liked && 'fill-primary text-primary')} aria-hidden />
          <span className="tabular-nums" aria-live="polite">{state.count}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
