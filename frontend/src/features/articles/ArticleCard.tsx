import { Eye, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelative } from '@/lib/utils'
import type { ArticleCard } from '@/lib/types'
import { ScrollLink } from '@/features/common/ui'
import { paletteFor } from '@/features/common/sectionTheme'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'

interface ArticleCardItemProps {
  article: ArticleCard
  className?: string
  showFavorite?: boolean
}

export function ArticleCardItem({ article, className, showFavorite = true }: ArticleCardItemProps) {
  const palette = paletteFor(article.sectionCode)
  return (
    <article
      className={cn(
        'group relative flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-4 transition',
        'hover:border-primary/30 hover:shadow-glass',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', palette.chip)}>
          {article.sectionName}
        </span>
        {article.rewardGranted ? (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Sparkles className="size-2.5" aria-hidden />
            已获积分
          </Badge>
        ) : null}
        <span className="ml-auto text-[11px] text-muted-foreground">{formatRelative(article.createdAt)}</span>
      </div>

      <ScrollLink to={'/articles/' + article.id} className="block focus-visible:outline-none">
        <h3 className="text-base font-semibold leading-snug text-foreground transition group-hover:text-primary">
          {article.title}
        </h3>
        {article.summary ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
        ) : null}
      </ScrollLink>

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Avatar name={article.authorName} hue={article.authorAvatarHue} size={22} />
        <span className="truncate text-xs text-muted-foreground">{article.authorName}</span>
        <span className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {article.viewCount}
          </span>
        </span>
        {showFavorite ? (
          <FavoriteButton
            targetType="article"
            targetId={article.id}
            initialFavorited={article.favorite}
            className="ml-1"
          />
        ) : null}
      </div>
    </article>
  )
}

export default ArticleCardItem
