import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { errorMessage, isUnauthorized } from '@/features/common/hooks'

export type FavoriteTargetType = 'article' | 'question' | 'resource'

export const FAVORITE_CHANGED_EVENT = 'its-study:favorite-changed'

export interface FavoriteChangeDetail {
  targetType: FavoriteTargetType
  targetId: number
  favorited: boolean
}

interface FavoriteButtonProps {
  targetType: FavoriteTargetType
  targetId: number
  initialFavorited: boolean
  showLabel?: boolean
  className?: string
}

export function FavoriteButton({
  targetType,
  targetId,
  initialFavorited,
  showLabel = false,
  className,
}: FavoriteButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [favorited, setFavorited] = useState(initialFavorited)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setFavorited(initialFavorited)
  }, [initialFavorited, targetId])

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (pending) return
    const next = !favorited
    setFavorited(next)
    setPending(true)
    try {
      const result = await api.toggleFavorite(targetType, targetId)
      setFavorited(result.favorited)
      window.dispatchEvent(
        new CustomEvent<FavoriteChangeDetail>(FAVORITE_CHANGED_EVENT, {
          detail: { targetType, targetId, favorited: result.favorited },
        }),
      )
      toast.success(result.favorited ? '已加入收藏' : '已取消收藏')
    } catch (error) {
      setFavorited(!next)
      if (isUnauthorized(error)) {
        const redirect = encodeURIComponent(location.pathname + location.search)
        toast.error('请先登录', {
          description: '登录后即可收藏内容',
          action: { label: '去登录', onClick: () => navigate('/login?redirect=' + redirect) },
        })
      } else {
        toast.error(errorMessage(error, '收藏失败，请重试'))
      }
    } finally {
      setPending(false)
    }
  }

  const Icon = pending ? Loader2 : favorited ? BookmarkCheck : Bookmark

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? '取消收藏' : '收藏'}
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
        favorited
          ? 'border-warning/40 bg-warning/10 text-warning-foreground dark:text-warning'
          : 'border-border/80 bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-primary',
        className,
      )}
    >
      <Icon className={cn('size-3.5', pending && 'animate-spin')} aria-hidden />
      {showLabel ? <span>{favorited ? '已收藏' : '收藏'}</span> : null}
    </button>
  )
}

export default FavoriteButton
