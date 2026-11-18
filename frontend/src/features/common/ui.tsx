import type { MouseEvent, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertTriangle, ChevronLeft, ChevronRight, LogIn, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'
import type { Section } from '@/lib/types'
import { rememberScroll } from './hooks'

export function ErrorBlock({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="leading-relaxed">{message}</p>
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <RefreshCw aria-hidden />
          重试
        </Button>
      ) : null}
    </div>
  )
}

export function LoadingRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border/60 bg-card/50 p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoadingGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)} aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border/60 bg-card/50 p-5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
          <div className="mt-5 flex items-center justify-between">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  layoutId = 'segmented-indicator',
  className,
}: {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (value: T) => void
  layoutId?: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-border/70 bg-muted/60 p-1 text-sm text-muted-foreground',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
              active ? 'text-foreground' : 'hover:text-foreground',
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-[1] rounded-lg bg-card shadow-sm ring-1 ring-border/70"
                transition={spring.snappy}
              />
            ) : null}
            <span className="relative z-[1] whitespace-nowrap">
              {option.label}
              {typeof option.count === 'number' ? (
                <span className="ml-1 text-xs tabular-nums text-muted-foreground">{option.count}</span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function Pager({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
}) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className={cn('flex items-center justify-center gap-3 pt-1', className)}>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft aria-hidden />
        上一页
      </Button>
      <span className="text-xs tabular-nums text-muted-foreground">
        第 {page} / {totalPages} 页
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        下一页
        <ChevronRight aria-hidden />
      </Button>
    </div>
  )
}

export function SectionSelect({
  sections,
  value,
  onChange,
  id,
  invalid,
  placeholder = '全部版块',
  className,
  disabled,
}: {
  sections: Section[]
  value: number | null
  onChange: (value: number | null) => void
  id?: string
  invalid?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <select
      id={id}
      value={value === null ? '' : String(value)}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      className={cn(
        'h-10 w-full appearance-none rounded-lg border border-input bg-card/80 px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
        invalid && 'border-destructive focus-visible:ring-destructive',
        className,
      )}
    >
      <option value="">{placeholder}</option>
      {sections.map((section) => (
        <option key={section.id} value={section.id}>
          {section.name}
        </option>
      ))}
    </select>
  )
}

/** 列表跳详情前写入滚动记忆，返回时由页面 useRestoreScroll 还原。 */
export function ScrollLink({
  to,
  className,
  children,
  onClick,
  ariaLabel,
}: {
  to: string
  className?: string
  children: ReactNode
  onClick?: () => void
  ariaLabel?: string
}) {
  const location = useLocation()
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    rememberScroll(location.pathname + location.search)
    onClick?.()
  }
  return (
    <Link to={to} className={className} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}

export function LoginPrompt({
  title = '请先登录',
  description = '登录后即可继续操作，还没有账号？注册只要半分钟。',
  redirect,
  className,
}: {
  title?: string
  description?: string
  redirect?: string
  className?: string
}) {
  const suffix = redirect ? '?redirect=' + encodeURIComponent(redirect) : ''
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border bg-card/60 p-8',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LogIn className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to={'/login' + suffix}>去登录</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={'/register' + suffix}>注册账号</Link>
        </Button>
      </div>
    </div>
  )
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('container py-8 sm:py-10', className)}>{children}</div>
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-2">
        {eyebrow ? <div className="text-xs font-medium uppercase tracking-wide text-primary">{eyebrow}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
