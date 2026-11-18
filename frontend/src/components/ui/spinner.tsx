import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)} role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label ? <span>{label}</span> : <span className="sr-only">加载中</span>}
    </span>
  )
}
