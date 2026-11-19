import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, HelpCircle, Package } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { spring } from '@/lib/motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import type { ArticleCard, Page, QuestionCard, ResourceCard } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, PageShell, Pager, Segmented } from '@/features/common/ui'
import { ArticleCardItem } from '@/features/articles/ArticleCard'
import { QuestionCardItem } from '@/features/questions/QuestionCard'
import { ResourceCardItem } from '@/features/resources/ResourceCard'

type TabKey = 'article' | 'question' | 'resource'
type ListItem = ArticleCard | QuestionCard | ResourceCard

const PAGE_SIZE = 8

export default function SectionPage() {
  const { code = '' } = useParams()
  const reduced = useReducedMotion()
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
              <h1 className="page-title mt-3">
                {section.data?.name}
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
        <div className="glass-2 sticky top-16 z-20 -mx-4 border-b px-4 py-2.5 md:-mx-6 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <TabsList aria-label="版块内容">
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
            </div>
          </div>
        </div>

        <motion.div layout={reduced ? false : "size"} transition={spring.gentle} className="min-h-[320px] pt-6">
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
                  {((list.data?.items ?? []) as ArticleCard[]).map((article) => (
                    <ArticleCardItem article={article} className="h-full" key={article.id} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="question" className="mt-0">
                <div className="space-y-3">
                  {((list.data?.items ?? []) as QuestionCard[]).map((question) => (
                    <QuestionCardItem question={question} key={question.id} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="resource" className="mt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  {((list.data?.items ?? []) as ResourceCard[]).map((resource) => (
                    <ResourceCardItem resource={resource} className="h-full" key={resource.id} />
                  ))}
                </div>
              </TabsContent>
            </>
          )}
        </motion.div>
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
      />
    )
  }
  if (tab === 'question') {
    return (
      <EmptyState
        icon={<HelpCircle className="size-5" aria-hidden />}
        title={filter === 'all' ? '这个版块还没有提问' : filter === 'solved' ? '还没有已解决的问题' : '没有未解决的问题'}
      />
    )
  }
  return (
    <EmptyState
      icon={<Package className="size-5" aria-hidden />}
      title="这个版块还没有资源"
    />
  )
}
