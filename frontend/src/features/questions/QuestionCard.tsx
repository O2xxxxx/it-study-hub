import { LikeButton } from '@/features/likes/LikeButton'
import { AuthorLink } from '@/features/profile/AuthorLink'
import { CheckCircle2, CircleDashed, Eye, MessageSquare } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelative } from '@/lib/utils'
import type { QuestionCard } from '@/lib/types'
import { ScrollLink } from '@/features/common/ui'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'

interface QuestionCardItemProps {
  question: QuestionCard
  className?: string
  showFavorite?: boolean
}

export function QuestionCardItem({ question, className, showFavorite = true }: QuestionCardItemProps) {
  return (
    <article className={cn(
        'content-card relative group flex flex-col gap-2.5 rounded-2xl border bg-card p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {question.sectionName}
        </span>
        {question.solved ? (
          <Badge variant="success" className="gap-1 text-[10px]">
            <CheckCircle2 className="size-2.5" aria-hidden />
            已解决
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1 text-[10px]">
            <CircleDashed className="size-2.5" aria-hidden />
            未解决
          </Badge>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">{formatRelative(question.createdAt)}</span>
      </div>

      <ScrollLink to={'/qa/' + question.id} className="card-cover block focus-visible:outline-none">
        <h3 className="text-base font-semibold leading-snug text-foreground transition group-hover:text-primary">
          {question.title}
        </h3>
      </ScrollLink>

      <div className="mt-auto flex min-w-0 items-center gap-2 pt-2 leading-none">
        <Avatar name={question.authorName} hue={question.authorAvatarHue} size={22} />
        <AuthorLink username={question.authorUsername} className="truncate text-xs text-muted-foreground">{question.authorName}</AuthorLink>
        <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden />
            {question.answerCount} 回答
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {question.viewCount}
          </span>
        </span>
        <LikeButton type="question" id={question.id} count={question.likeCount} liked={question.likedByMe} />
        {showFavorite ? (
          <FavoriteButton
            targetType="question"
            targetId={question.id}
            initialFavorited={question.favorite}
            className="relative z-10"
          />
        ) : null}
      </div>
    </article>
  )
}

export default QuestionCardItem
