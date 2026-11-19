import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync, useDocumentTitle, useRestoreScroll } from '@/features/common/hooks'
import { ErrorBlock, LoadingRows, PageShell } from '@/features/common/ui'
import { sectionIcon } from '@/features/common/sectionTheme'
import { useSearchController } from '@/features/search/SearchProvider'
import { ArticleCardItem } from '@/features/articles/ArticleCard'
import { QuestionCardItem } from '@/features/questions/QuestionCard'
import { ResourceCardItem } from '@/features/resources/ResourceCard'
import { api } from '@/lib/api'

export default function HomePage() {
  const { open } = useSearchController()
  const { user } = useAuth()
  const location = useLocation()
  const sections = useAsync(() => api.sections(), [])
  const articles = useAsync(() => api.articles({ page: 1, size: 3, sort: 'latest' }), [user?.id])
  const questions = useAsync(() => api.questions({ page: 1, size: 3, filter: 'all' }), [user?.id])
  const resources = useAsync(() => api.resources({ page: 1, size: 3 }), [user?.id])
  useDocumentTitle('首页')
  useRestoreScroll(location.pathname, !sections.loading && !articles.loading && !questions.loading && !resources.loading)

  return (
    <PageShell className="!py-0">
      <section className="py-12 text-center md:py-24" aria-labelledby="home-title">
        <h1 id="home-title" className="page-title text-balance">把学过的技术，写成能查到的答案</h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-muted-foreground md:text-base">浏览 Java、数据库与前端的技术文章、问答和学习资料。</p>
        <button id="home-search" type="button" onClick={() => open()}
          className="glass-1 mx-auto mt-8 flex h-12 w-full max-w-xl items-center gap-3 rounded-xl px-4 text-left text-sm
            text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Search className="size-4 text-primary" aria-hidden />
          搜索文章、问答、资源
          <kbd className="ml-auto hidden rounded border px-1.5 text-xs sm:inline">{/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K'}</kbd>
        </button>
      </section>
      <div className="space-y-8 pb-12 md:space-y-16 md:pb-24">
        <HomeGroup title="技术版块" loading={sections.loading} error={sections.error} retry={sections.reload}>
          {sections.data?.slice(0, 3).map(section => {
            const Icon = sectionIcon(section.icon)
            return <Link key={section.id} to={'/s/' + section.code}
              className="content-card flex min-w-0 flex-col gap-2 rounded-2xl border bg-card p-5 focus-visible:ring-2 focus-visible:ring-ring">
              <Icon className="size-5 text-primary" aria-hidden />
              <h3 className="font-semibold">{section.name}</h3>
              <p className="text-sm text-muted-foreground">{section.tagline}</p>
            </Link>
          })}
        </HomeGroup>
        <HomeGroup title="最新文章" loading={articles.loading} error={articles.error} retry={articles.reload}>
          {articles.data?.items.map(article => <ArticleCardItem key={article.id} article={article} />)}
        </HomeGroup>
        <HomeGroup title="近期问答" loading={questions.loading} error={questions.error} retry={questions.reload}>
          {questions.data?.items.map(question => <QuestionCardItem key={question.id} question={question} />)}
        </HomeGroup>
        <HomeGroup title="学习资源" loading={resources.loading} error={resources.error} retry={resources.reload}>
          {resources.data?.items.map(resource => <ResourceCardItem key={resource.id} resource={resource} />)}
        </HomeGroup>
      </div>
    </PageShell>
  )
}

function HomeGroup({ title, loading, error, retry, children }: {
  title: string
  loading: boolean
  error: string | null
  retry: () => void
  children: ReactNode
}) {
  return (
    <section className="border-t pt-6 md:pt-10" aria-label={title}>
      <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>
      {loading ? <LoadingRows rows={2} /> : error ? <ErrorBlock message={error} onRetry={retry} /> :
        Array.isArray(children) && children.length ? <div className="grid gap-4 md:grid-cols-3">{children}</div>
          : <p className="text-sm text-muted-foreground">暂无内容</p>}
    </section>
  )
}
