import { FileArchive, FileCode2, FileText, Film, Image as ImageIcon, Lock, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatFileSize } from '@/lib/utils'
import type { ResourceCard } from '@/lib/types'
import { ScrollLink } from '@/features/common/ui'
import { paletteFor } from '@/features/common/sectionTheme'

function iconForType(fileType?: string | null) {
  const value = (fileType ?? '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(value)) return ImageIcon
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(value)) return FileArchive
  if (['mp4', 'mov', 'avi', 'mkv'].includes(value)) return Film
  if (['js', 'ts', 'tsx', 'java', 'sql', 'py', 'json', 'html', 'css', 'xml'].includes(value)) return FileCode2
  return FileText
}

interface ResourceCardItemProps {
  resource: ResourceCard
  className?: string
}

export function ResourceCardItem({ resource, className }: ResourceCardItemProps) {
  const palette = paletteFor(resource.sectionCode)
  const Icon = iconForType(resource.fileType)
  return (
    <ScrollLink
      to={'/resources/' + resource.id}
      className={cn(
        'group flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 transition',
        'hover:border-primary/30 hover:shadow-glass focus-visible:outline-none',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', palette.chip)}>
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground transition group-hover:text-primary">
            {resource.title}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {resource.sectionName} · {(resource.fileType ?? '文件').toUpperCase()} · {formatFileSize(resource.fileSize)}
          </p>
        </div>
        {resource.owned ? (
          <Badge variant="success" className="gap-1 text-[10px]">
            <Unlock className="size-2.5" aria-hidden />
            已拥有
          </Badge>
        ) : null}
      </div>

      {resource.description ? (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{resource.description}</p>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-2.5">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock className="size-3" aria-hidden />
          {resource.owned ? '可直接下载' : '下载需兑换'}
        </span>
        <span className="text-sm font-semibold tabular-nums text-primary">{resource.points} 积分</span>
      </div>
    </ScrollLink>
  )
}

export default ResourceCardItem
