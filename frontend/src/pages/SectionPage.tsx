import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, HelpCircle, Package } from 'lucide-react'
import { motion } from 'motion/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import type { ArticleCard, Page, QuestionCard, ResourceCard } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAsync, useDocumentTitle, useRestoreScroll } from '@/features/common/hooks'
import { ErrorBlock, PageShell, Pager, Segmented } from '@/features/common/ui'
import { paletteFor } from '@/features/common/sectionTheme'
import { ArticleCardItem } from '@/features/articles/ArticleCard'
import { QuestionCardItem } from '@/features/questions/QuestionCard'
import { ResourceCardItem } from '@/features/resources/ResourceCard'

type TabKey = 'article' | 'question' | 'resource'
type ListItem = ArticleCard | QuestionCard | ResourceCard

const PAGE_SIZE = 8

export default function SectionPage() {
  const { code = '' } = useParams()
  const location = useLocation()
  const [tab, setTab] = useState<TabKey>('article')
  const [sort, setSort] = useState<'latest' | 'hot'>('latest')
  const [filter, setFilter] = useState<'all' | 'unsolved' | 'solved'>('all')
  const [pageNo, setPageNo] = useState(1)
  const [retryKey, setRetryKey] = useState(0)

  const section = useAsync(() => api.section(code), [code])

  useEffect(() => {
    setPageNo(1)
  }, [tab, sort, filter, code])

  const list = useAsync<Page<ListItem>>(async () => {
    if (tab === 'article') {
      const result = await api.articles({ sectionCode: code, page: pageNo, size: PAGE_SIZE, sort })
      return result as unknown as Page<ListItem>
    }
    if (tab === 'question') {
      const result = await api.questions({ sectionCode: code, page: pageNo, size: PAGE_SIZE, filter })
      return result as unknown as Page<ListItem>
    }
    const result = await api.resources({ sectionCode: code, page: pageNo, size: PAGE_SIZE })
    return result as unknown as Page<ListItem>
  }, [code, tab, pageNo, sort, filter, retryKey])

  useDocumentTitle(section.data?.name ?? '版块详情')
  useRestoreScroll(location.pathname, !list.loading)

  const total = list.data?.total ?? 0
  const counts = {
    article: section.data?.articleCount ?? 0,
    question: section.data?.questionCount ?? 0,
    resource: section.data?.resourceCount ?? 0,
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/sections"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3" aria-hidden />
            全部版块
          </Link>
          {section.loading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-72" />
            </div>
          ) : section.error ? (
            <ErrorBlock className="mt-2" message={section.error} onRetry={section.reload} />
          ) : (
            <>
              <h1 className="mt-1.5 flex items-center gap-2 text-2xl font-semibold tracking-tight">
                {section.data?.name}
                {section.data ? (
                  <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', paletteFor(section.data.accent ?? section.data.code).chip)}>
                    /{section.data.code}
                  </span>
                ) : null}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {section.data?.tagline || section.data?.description}
              </p>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/articles/new">
              <FileText className="size-3.5" aria-hidden />
              写文章
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/qa/new">
              <HelpCircle className="size-3.5" aria-hidden />
              我要提问
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="mt-5">
        <div className="glass-2 sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/80 px-4 py-2.5 backdrop-blur-md md:-mx-6 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <TabsList className="h-9">
              <TabsTrigger value="article" indicatorId="section-tab">
                文章
                <span className="text-[10px] tabular-nums text-muted-foreground">{counts.article}</span>
              </TabsTrigger>
              <TabsTrigger value="question" indicatorId="section-tab">
                问答
                <span className="text-[10px] tabular-nums text-muted-foreground">{counts.question}</span>
              </TabsTrigger>
              <TabsTrigger value="resource" indicatorId="section-tab">
                资源
                <span className="text-[10px] tabular-nums text-muted-foreground">{counts.resource}</span>
              </TabsTrigger>
            </TabsList>

            <div className="ml-auto flex items-center gap-2">
              {tab === 'article' ? (
                <Segmented<'latest' | 'hot'>
                  layoutId="section-sort-indicator"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'latest', label: '最新' },
                    { value: 'hot', label: '最热' },
                  ]}
                />
              ) : null}
              {tab === 'question' ? (
                <Segmented<'all' | 'unsolved' | 'solved'>
                  layoutId="section-filter-indicator"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: 'all', label: '全部' },
                    { value: 'unsolved', label: '未解决' },
                    { value: 'solved', label: '已解决' },
                  ]}
                />
              ) : null}
              {tab === 'resource' ? (
                <span className="hidden text-xs text-muted-foreground sm:inline">共 {counts.resource} 份资源</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-h-[560px] pt-4">
          {list.loading ? (
            <div className={cn('grid gap-3', tab === 'question' ? 'grid-cols-1' : 'sm:grid-cols-2')}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className={tab === 'question' ? 'h-[112px] rounded-xl' : 'h-[150px] rounded-xl'} />
              ))}
            </div>
          ) : list.error ? (
            <ErrorBlock message={list.error} onRetry={() => setRetryKey((value) => value + 1)} />
          ) : total === 0 ? (
            <TabEmpty tab={tab} filter={filter} />
          ) : (
            <>
              <TabsContent value="article" className="mt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  {((list.data?.items ?? []) as ArticleCard[]).map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.24 }}
                    >
                      <ArticleCardItem article={article} className="h-full" />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="question" className="mt-0">
                <div className="space-y-3">
                  {((list.data?.items ?? []) as QuestionCard[]).map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.24 }}
                    >
                      <QuestionCardItem question={question} />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="resource" className="mt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  {((list.data?.items ?? []) as ResourceCard[]).map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.24 }}
                    >
                      <ResourceCardItem resource={resource} className="h-full" />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      <Pager className="mt-6" page={pageNo} totalPages={list.data?.totalPages ?? 1} onChange={setPageNo} />
    </PageShell>
  )
}

function TabEmpty({ tab, filter }: { tab: TabKey; filter: 'all' | 'unsolved' | 'solved' }) {
  if (tab === 'article') {
    return (
      <EmptyState
        icon={<FileText className="size-5" aria-hidden />}
        title="这个版块还没有文章"
        description="成为第一个在这里记录学习笔记的人。"
        action={
          <Button asChild size="sm">
            <Link to="/articles/new">写第一篇</Link>
          </Button>
        }
      />
    )
  }
  if (tab === 'question') {
    return (
      <EmptyState
        icon={<HelpCircle className="size-5" aria-hidden />}
        title={filter === 'all' ? '这个版块还没有提问' : filter === 'solved' ? '还没有已解决的问题' : '没有未解决的问题'}
        description={filter === 'all' ? '有问题可以直接问，提问不消耗积分。' : '换个筛选条件看看。'}
        action={
          <Button asChild size="sm">
            <Link to="/qa/new">我要提问</Link>
          </Button>
        }
      />
    )
  }
  return (
    <EmptyState
      icon={<Package className="size-5" aria-hidden />}
      title="这个版块还没有资源"
      description="笔记、模板、示例代码都可以分享出来。"
    />
  )
}
