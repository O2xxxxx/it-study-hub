import { LikeButton } from '@/features/likes/LikeButton'
import { AuthorLink } from '@/features/profile/AuthorLink'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Eye, PenLine, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { cn, formatDateTime } from '@/lib/utils'
import { useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, PageShell, ScrollLink } from '@/features/common/ui'
import { paletteFor } from '@/features/common/sectionTheme'
import { MarkdownView } from '@/features/markdown/MarkdownView'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'

export default function ArticlePage() {
  const { id } = useParams()
  const articleId = Number(id)
  const valid = Number.isFinite(articleId) && articleId > 0
  const state = useAsync(() => api.article(articleId), [articleId, valid])
  const article = state.data
  useDocumentTitle(article?.title ?? '文章')

  if (!valid) {
    return (
      <PageShell>
        <EmptyState
          title="文章不存在"
          description="链接里的文章编号不正确。"
          action={<Button asChild><Link to="/">回到首页</Link></Button>}
        />
      </PageShell>
    )
  }

  return (
    <PageShell className="max-w-3xl" loading={state.loading && !article}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          to="/sections"
          className="inline-flex items-center gap-1 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3" aria-hidden />
          版块
        </Link>
        {article ? (
          <>
            <span aria-hidden>/</span>
            <ScrollLink to={'/s/' + article.section.code} className="transition hover:text-primary">
              {article.section.name}
            </ScrollLink>
          </>
        ) : null}
      </div>

      {state.loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className={index % 3 === 2 ? 'h-4 w-2/3' : 'h-4 w-full'} />
            ))}
          </div>
        </div>
      ) : state.error ? (
        <ErrorBlock className="mt-6" message={state.error} onRetry={state.reload} />
      ) : !article ? (
        <EmptyState
          className="mt-6"
          title="文章不存在"
          description="它可能已被删除。"
          action={<Button asChild><Link to="/">回到首页</Link></Button>}
        />
      ) : (
        <article className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', paletteFor(article.section.accent ?? article.section.code).chip)}>
              {article.section.name}
            </span>
            {article.rewardGranted ? (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Sparkles className="size-2.5" aria-hidden />
                已获 +5 积分
              </Badge>
            ) : null}
          </div>

          <h1 className="page-title mt-3 text-balance">
            {article.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-border/70 pb-4">
            <Avatar name={article.author.nickname} hue={article.author.avatarHue} size={32} />
            <div className="min-w-0">
              <AuthorLink username={article.author.username} className="block truncate text-sm font-medium">{article.author.nickname}</AuthorLink>
              <p className="text-[11px] text-muted-foreground">
                {formatDateTime(article.createdAt)}
                {article.updatedAt && article.updatedAt !== article.createdAt
                  ? ' · 更新于 ' + formatDateTime(article.updatedAt)
                  : ''}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Eye className="size-3.5" aria-hidden />
              {article.viewCount} 次浏览
            </span>
            <div className="ml-auto flex items-center gap-2">
              {article.canEdit ? (
                <Button asChild variant="outline" size="sm">
                  <Link to={'/articles/' + article.id + '/edit'}>
                    <PenLine className="size-3.5" aria-hidden />
                    编辑
                  </Link>
                </Button>
              ) : null}
              <LikeButton type="article" id={article.id} count={article.likeCount} liked={article.likedByMe} />
              <FavoriteButton targetType="article" targetId={article.id} initialFavorited={article.favorite} showLabel />
            </div>
          </div>

          <MarkdownView html={article.contentHtml} pageTitle={article.title} className="mt-6" />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
            <p className="text-sm text-muted-foreground">觉得有用？收藏起来，下次直接从「我的收藏」打开。</p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/articles/new">写一篇</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={'/s/' + article.section.code}>看更多{article.section.name}内容</Link>
              </Button>
            </div>
          </div>
        </article>
      )}
    </PageShell>
  )
}
