import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Coins, Download, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { useAsync, useDocumentTitle, useRestoreScroll } from '@/features/common/hooks'
import { ErrorBlock, LoadingGrid, PageHeading, PageShell, Pager } from '@/features/common/ui'
import { ResourceCardItem } from '@/features/resources/ResourceCard'

const PAGE_SIZE = 9

export default function ResourcesPage() {
  useDocumentTitle('技术资源')
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const sectionCode = params.get('sectionCode') ?? ''
  const pageNo = Math.max(1, Number(params.get('page') ?? '1') || 1)

  const sections = useAsync(() => api.sections(), [])
  const list = useAsync(
    () => api.resources({ page: pageNo, size: PAGE_SIZE, sectionCode: sectionCode || undefined }),
    [pageNo, sectionCode],
  )
  useRestoreScroll(location.pathname + location.search, !list.loading)

  const setSection = (code: string) => {
    const merged = new URLSearchParams(params)
    if (code) merged.set('sectionCode', code)
    else merged.delete('sectionCode')
    merged.delete('page')
    setParams(merged, { replace: true })
  }

  const setPage = (page: number) => {
    const merged = new URLSearchParams(params)
    if (page > 1) merged.set('page', String(page))
    else merged.delete('page')
    setParams(merged, { replace: true })
  }

  return (
    <PageShell>
      <PageHeading
        eyebrow="资源"
        title="技术资料区"
        description="原创整理的讲义与清单，每份默认 5 积分。兑换后可以反复下载，不会重复扣分。"
        actions={
          <Button asChild variant="outline">
            <Link to="/points">
              <Coins className="size-4" aria-hidden />
              查看我的积分
            </Link>
          </Button>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSection('')}
          className={
            sectionCode === ''
              ? 'rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30'
              : 'rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground'
          }
        >
          全部版块
        </button>
        {(sections.data ?? []).map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setSection(item.code)}
            className={
              sectionCode === item.code
                ? 'rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30'
                : 'rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground'
            }
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-xs text-muted-foreground">
        <p>{list.data ? '共 ' + list.data.total + ' 份资料' : '正在加载资料…'}</p>
        <p className="inline-flex items-center gap-1">
          <Info className="size-3" aria-hidden />
          兑换后从「个人中心 → 积分中心 → 已兑换资源」也能直接下载
        </p>
      </div>

      <div className="mt-4">
        {list.error ? (
          <ErrorBlock message={list.error} onRetry={list.reload} />
        ) : list.loading ? (
          <LoadingGrid count={6} />
        ) : !list.data || list.data.items.length === 0 ? (
          <EmptyState
            icon={<Download className="size-5" aria-hidden />}
            title="这个版块还没有资料"
            description="换一个版块看看，Java、数据库和 Web 前端都有示例资料。"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.data.items.map((resource) => (
              <ResourceCardItem key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>

      {list.data ? (
        <Pager className="mt-6" page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} />
      ) : null}
    </PageShell>
  )
}
