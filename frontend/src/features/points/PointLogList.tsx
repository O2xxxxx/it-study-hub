import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Coins } from 'lucide-react'
import type { PointLog } from '@/lib/types'
import { cn, formatDateTime } from '@/lib/utils'
import { reasonLabel } from '@/features/common/sectionTheme'
import { EmptyState } from '@/components/ui/empty-state'

const REF_ROUTES: Record<string, (id: string) => string> = {
  ARTICLE: (id) => '/articles/' + id,
  QUESTION: (id) => '/qa/' + id,
  RESOURCE: (id) => '/resources/' + id,
}

export function refLink(log: PointLog): string | null {
  if (!log.refId) return null
  if (log.refType && REF_ROUTES[log.refType]) return REF_ROUTES[log.refType](String(log.refId))
  if (log.reasonType === 'ARTICLE_REWARD') return '/articles/' + log.refId
  if (log.reasonType === 'ANSWER_REWARD') return '/qa/' + log.refId
  if (log.reasonType === 'RESOURCE_EXCHANGE') return '/resources/' + log.refId
  return null
}

export function PointLogList({ logs, className }: { logs: PointLog[]; className?: string }) {
  if (logs.length === 0) {
    return (
      <EmptyState
        className={className}
        icon={<Coins className="size-5" aria-hidden />}
        title="还没有积分流水"
        description="发布文章 +5 积分、回答他人问题 +3 积分，兑换资源会消耗积分。"
      />
    )
  }

  return (
    <ul className={cn('divide-y divide-border/60', className)}>
      {logs.map((log) => {
        const positive = log.changeAmount > 0
        const href = refLink(log)
        return (
          <li key={log.id} className="flex items-center gap-3 py-3">
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full',
                positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600',
              )}
              aria-hidden
            >
              {positive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {log.reasonDesc || reasonLabel(log.reasonType)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatDateTime(log.createdAt)} · 余额 {log.balanceAfter}
                {href ? (
                  <>
                    {' · '}
                    <Link to={href} className="text-primary underline-offset-2 hover:underline">
                      查看关联内容
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 text-sm font-semibold tabular-nums',
                positive ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {positive ? '+' : ''}
              {log.changeAmount}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default PointLogList
