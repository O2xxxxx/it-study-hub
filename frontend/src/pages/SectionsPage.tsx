import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, PageHeading, PageShell, ScrollLink } from '@/features/common/ui'
import { sectionIcon } from '@/features/common/sectionTheme'

export default function SectionsPage() {
  useDocumentTitle('版块')
  const sections = useAsync(() => api.sections(), [])

  return (
    <PageShell>
      <PageHeading title="技术版块" description="按技术方向查找文章、问答和学习资料。" />
      <div className="mt-8 border-t pt-6 md:mt-10 md:pt-10">
        {sections.loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map(index => <Skeleton key={index} className="h-36 rounded-2xl" />)}
          </div>
        ) : sections.error ? (
          <ErrorBlock message={sections.error} onRetry={sections.reload} />
        ) : sections.data?.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {sections.data.map(section => {
              const Icon = sectionIcon(section.icon)
              return (
                <ScrollLink key={section.id} to={'/s/' + section.code}
                  className="content-card flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-6 focus-visible:ring-2 focus-visible:ring-ring">
                  <Icon className="size-5 text-primary" aria-hidden />
                  <h2 className="text-lg font-semibold">{section.name}</h2>
                  <p className="text-[15px] text-muted-foreground">{section.tagline || section.description}</p>
                  <p className="mt-auto text-sm tabular-nums text-muted-foreground">
                    {section.articleCount} 篇文章 · {section.questionCount} 条问答 · {section.resourceCount} 份资料
                  </p>
                </ScrollLink>
              )
            })}
          </div>
        ) : <EmptyState title="暂无技术版块" />}
      </div>
      <Link to="/qa/new" className="mt-8 inline-block rounded-sm text-sm text-primary focus-visible:ring-2 focus-visible:ring-ring">提一个问题</Link>
    </PageShell>
  )
}
