import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight, BookOpen, FileText, Flame, HelpCircle, Layers, Package, Search, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { ArticleCard, QuestionCard, ResourceCard } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, PageShell, ScrollLink } from '@/features/common/ui'
import { paletteFor, sectionIcon } from '@/features/common/sectionTheme'
import { useSearchController } from '@/features/search/SearchProvider'
import { ArticleCardItem } from '@/features/articles/ArticleCard'
import { QuestionCardItem } from '@/features/questions/QuestionCard'
import { ResourceCardItem } from '@/features/resources/ResourceCard'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export default function HomePage() {
  useDocumentTitle('首页')
  const { open } = useSearchController()

  const sections = useAsync(() => api.sections(), [])
  const latest = useAsync(() => api.articles({ page: 1, size: 6, sort: 'latest' }), [])
  const hot = useAsync(() => api.questions({ page: 1, size: 5, filter: 'all' }), [])
  const picks = useAsync(() => api.resources({ page: 1, size: 4 }), [])

  const totals = useMemo(() => {
    const list = sections.data ?? []
    return list.reduce(
      (acc, section) => ({
        articles: acc.articles + section.articleCount,
        questions: acc.questions + section.questionCount,
        resources: acc.resources + section.resourceCount,
      }),
      { articles: 0, questions: 0, resources: 0 },
    )
  }, [sections.data])

  const hotQuestions = useMemo(() => {
    const items = [...(hot.data?.items ?? [])]
    return items.sort((a, b) => b.answerCount - a.answerCount).slice(0, 5)
  }, [hot.data])

  return (
    <PageShell>
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">IT 学习天地 · 课程知识库</p>
          <h1 className="mt-2 max-w-2xl text-balance text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            把 Java、数据库、前端的坑，写成能查到的答案
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            文章、问答、资源三块互通，按版块归档。登录后可收藏、提问、写文章赚积分，用积分兑换学习资料。
          </p>

          <button
            type="button"
            onClick={() => open()}
            className="group mt-5 flex w-full max-w-2xl items-center gap-3 rounded-xl border border-border/80 bg-background/85 px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1 truncate text-sm text-muted-foreground">搜索文章、问答、资源…</span>
            <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">{IS_MAC ? '⌘ K' : 'Ctrl K'}</kbd>
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5" aria-hidden />
              <b className="tabular-nums text-foreground">{totals.articles}</b> 篇文章
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="size-3.5" aria-hidden />
              <b className="tabular-nums text-foreground">{totals.questions}</b> 个问答
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-3.5" aria-hidden />
              <b className="tabular-nums text-foreground">{totals.resources}</b> 份资源
            </span>
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Sparkles className="size-3.5" aria-hidden />
              写文章 +5 积分 · 回答问题 +3 积分
            </span>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="home-sections">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="home-sections" className="flex items-center gap-2 text-base font-semibold">
            <Layers className="size-4 text-primary" aria-hidden />
            三个版块
          </h2>
          <Link to="/sections" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            全部版块
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
        {sections.loading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((index) => <Skeleton key={index} className="h-[132px] rounded-xl" />)}
          </div>
        ) : sections.error ? (
          <ErrorBlock message={sections.error} onRetry={sections.reload} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {(sections.data ?? []).map((section, index) => {
              const Icon = sectionIcon(section.icon)
              const palette = paletteFor(section.accent ?? section.code)
              return (
                <motion.div key={section.id} {...fadeUp} transition={{ delay: index * 0.05, duration: 0.26 }}>
                  <ScrollLink
                    to={'/s/' + section.code}
                    className="group flex h-full flex-col rounded-xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('flex size-9 items-center justify-center rounded-lg', palette.chip)}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{section.name}</span>
                      <ArrowRight className="ml-auto size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {section.tagline || section.description}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-[11px] text-muted-foreground">
                      <span>{section.articleCount} 文章</span>
                      <span>{section.questionCount} 问答</span>
                      <span>{section.resourceCount} 资源</span>
                    </div>
                  </ScrollLink>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="home-latest">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="home-latest" className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="size-4 text-primary" aria-hidden />
              最新文章
            </h2>
            <Link to="/sections" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              更多
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {latest.loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-[156px] rounded-xl" />)}
            </div>
          ) : latest.error ? (
            <ErrorBlock message={latest.error} onRetry={latest.reload} />
          ) : (latest.data?.items.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">还没有文章，来写第一篇</p>
              <Button asChild variant="soft" size="sm" className="mt-3">
                <Link to="/articles/new">写第一篇</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(latest.data?.items ?? []).map((article: ArticleCard, index) => (
                <motion.div key={article.id} {...fadeUp} transition={{ delay: index * 0.04, duration: 0.26 }}>
                  <ArticleCardItem article={article} className="h-full" />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="home-hot">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="home-hot" className="flex items-center gap-2 text-base font-semibold">
              <Flame className="size-4 text-primary" aria-hidden />
              热门问答
            </h2>
            <Link to="/qa" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              进入问答
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          {hot.loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((index) => <Skeleton key={index} className="h-[118px] rounded-xl" />)}
            </div>
          ) : hot.error ? (
            <ErrorBlock message={hot.error} onRetry={hot.reload} />
          ) : hotQuestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">还没有提问，来问第一个问题</p>
              <Button asChild variant="soft" size="sm" className="mt-3">
                <Link to="/qa/new">我要提问</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {hotQuestions.map((question: QuestionCard, index) => (
                <motion.div key={question.id} {...fadeUp} transition={{ delay: index * 0.04, duration: 0.26 }}>
                  <QuestionCardItem question={question} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8" aria-labelledby="home-resources">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="home-resources" className="flex items-center gap-2 text-base font-semibold">
            <Package className="size-4 text-primary" aria-hidden />
            精选资源
          </h2>
          <Link to="/resources" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            资源中心
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
        {picks.loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-[150px] rounded-xl" />)}
          </div>
        ) : picks.error ? (
          <ErrorBlock message={picks.error} onRetry={picks.reload} />
        ) : (picks.data?.items.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
            还没有分享资源
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(picks.data?.items ?? []).map((resource: ResourceCard, index) => (
              <motion.div key={resource.id} {...fadeUp} transition={{ delay: index * 0.04, duration: 0.26 }}>
                <ResourceCardItem resource={resource} className="h-full" />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
