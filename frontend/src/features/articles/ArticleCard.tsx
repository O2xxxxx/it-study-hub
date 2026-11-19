import { LikeButton } from '@/features/likes/LikeButton'
import { AuthorLink } from '@/features/profile/AuthorLink'
import { Eye } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn, formatRelative } from '@/lib/utils'
import type { ArticleCard } from '@/lib/types'
import { ScrollLink } from '@/features/common/ui'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'

interface ArticleCardItemProps {
  article: ArticleCard
  className?: string
  showFavorite?: boolean
}

export function ArticleCardItem({ article, className, showFavorite = true }: ArticleCardItemProps) {
  return (
    <article className={cn(
        'content-card relative group flex flex-col gap-2.5 rounded-2xl border bg-card p-5',
        className,
      )}
    >
      <div className="flex min-h-5 items-center gap-2 leading-5">
        <span className="text-xs text-muted-foreground">
          {article.sectionName}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">{formatRelative(article.createdAt)}</span>
      </div>

      <ScrollLink to={'/articles/' + article.id} className="card-cover block focus-visible:outline-none">
        <h3 className="text-base font-semibold leading-snug text-foreground transition group-hover:text-primary">
          {article.title}
        </h3>
        {article.summary ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
        ) : null}
      </ScrollLink>

      <div className="mt-auto flex min-w-0 items-center gap-2 pt-2 leading-none">
        <Avatar name={article.authorName} hue={article.authorAvatarHue} size={22} />
        <AuthorLink username={article.authorUsername} className="truncate text-xs text-muted-foreground">{article.authorName}</AuthorLink>
        <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {article.viewCount}
          </span>
        </span>
        <LikeButton type="article" id={article.id} count={article.likeCount} liked={article.likedByMe} />
        {showFavorite ? (
          <FavoriteButton
            targetType="article"
            targetId={article.id}
            initialFavorited={article.favorite}
            className="relative z-10"
          />
        ) : null}
      </div>
    </article>
  )
}

export default ArticleCardItem
