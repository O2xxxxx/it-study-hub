import { CheckCircle2, CircleDashed, Eye, MessageSquare } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelative } from '@/lib/utils'
import type { QuestionCard } from '@/lib/types'
import { ScrollLink } from '@/features/common/ui'
import { paletteFor } from '@/features/common/sectionTheme'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'

interface QuestionCardItemProps {
  question: QuestionCard
  className?: string
  showFavorite?: boolean
}

export function QuestionCardItem({ question, className, showFavorite = true }: QuestionCardItemProps) {
  const palette = paletteFor(question.sectionCode)
  return (
    <article
      className={cn(
        'group flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-4 transition',
        'hover:border-primary/30 hover:shadow-glass',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', palette.chip)}>
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

      <ScrollLink to={'/qa/' + question.id} className="block focus-visible:outline-none">
        <h3 className="text-base font-semibold leading-snug text-foreground transition group-hover:text-primary">
          {question.title}
        </h3>
      </ScrollLink>

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Avatar name={question.authorName} hue={question.authorAvatarHue} size={22} />
        <span className="truncate text-xs text-muted-foreground">{question.authorName}</span>
        <span className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden />
            {question.answerCount} 回答
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {question.viewCount}
          </span>
        </span>
        {showFavorite ? (
          <FavoriteButton
            targetType="question"
            targetId={question.id}
            initialFavorited={question.favorite}
            className="ml-1"
          />
        ) : null}
      </div>
    </article>
  )
}

export default QuestionCardItem
