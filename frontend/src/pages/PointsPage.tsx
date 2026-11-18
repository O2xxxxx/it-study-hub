import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight, Coins, Download, Receipt, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { cn, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage, useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, LoadingRows, PageShell, Segmented } from '@/features/common/ui'
import { AnimatedNumber } from '@/features/common/AnimatedNumber'
import { spring } from '@/lib/motion'

const REASON_LABEL: Record<string, string> = {
  ARTICLE_REWARD: '发布文章奖励',
  ANSWER_REWARD: '回答问题奖励',
  RESOURCE_EXCHANGE: '兑换技术资料',
}

type Tab = 'logs' | 'exchanges'

export default function PointsPage() {
  useDocumentTitle('积分中心')
  const { authenticated, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<Tab>('logs')
  const state = useAsync(() => api.points(), [authenticated])

  if (authLoading) {
    return (
      <PageShell>
        <LoadingRows rows={3} />
      </PageShell>
    )
  }

  if (!authenticated) {
    return (
      <PageShell className="max-w-2xl">
        <EmptyState
          icon={<Wallet className="size-5" aria-hidden />}
          title="登录后查看积分"
          description="积分余额、每一笔加分扣分和已兑换的资料都在这里。"
          action={<Button asChild><Link to="/login?redirect=/points">去登录</Link></Button>}
        />
      </PageShell>
    )
  }

  const data = state.data

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary">积分中心</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">我的积分</h1>
          <p className="mt-1 text-sm text-muted-foreground">发文章 +5，答题 +3，兑换资料按所需积分扣减。所有数字都来自服务端。</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/articles/new">去写一篇文章赚 5 分</Link>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
        className="mt-6 grid gap-4 sm:grid-cols-3"
      >
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.07] p-5 backdrop-blur-md">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="size-3.5" aria-hidden />
            当前余额
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
            <AnimatedNumber value={data?.balance ?? 0} />
            <span className="ml-1 text-sm font-normal text-muted-foreground">分</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur-md">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpRight className="size-3.5 text-success" aria-hidden />
            累计获得
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-success">
            +<AnimatedNumber value={data?.earned ?? 0} />
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur-md">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowDownRight className="size-3.5 text-destructive" aria-hidden />
            累计消耗
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-destructive">
            -<AnimatedNumber value={data?.spent ?? 0} />
          </p>
        </div>
      </motion.div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Segmented<Tab>
          layoutId="points-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'logs', label: '积分流水', count: data?.logs?.length ?? 0 },
            { value: 'exchanges', label: '已兑换资源', count: data?.exchanges?.length ?? 0 },
          ]}
        />
        {state.loading ? null : (
          <Button variant="ghost" size="sm" onClick={state.reload}>
            刷新数据
          </Button>
        )}
      </div>

      <div className="mt-4">
        {state.error ? (
          <ErrorBlock message={state.error} onRetry={state.reload} />
        ) : state.loading ? (
          <LoadingRows rows={4} />
        ) : tab === 'logs' ? (
          !data || data.logs.length === 0 ? (
            <EmptyState
              icon={<Receipt className="size-5" aria-hidden />}
              title="还没有积分流水"
              description="发布第一篇文章或回答一个问题，这里就会出现记录。"
              action={<Button asChild><Link to="/qa">去看看别人在问什么</Link></Button>}
            />
          ) : (
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card/60"
            >
              {data.logs.map((log) => {
                const positive = log.changeAmount > 0
                return (
                  <motion.li
                    key={log.id}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    transition={spring.soft}
                    className="flex flex-wrap items-center gap-3 px-4 py-3.5"
                  >
                    <span
                      className={cn(
                        'inline-flex min-w-[52px] items-center justify-center rounded-lg px-2 py-1 text-sm font-semibold tabular-nums',
                        positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {positive ? '+' : ''}
                      {log.changeAmount}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {log.reasonDesc || REASON_LABEL[log.reasonType] || log.reasonType}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatDateTime(log.createdAt)} · 变动后余额 {log.balanceAfter} 分
                      </p>
                    </div>
                    {log.refType === 'RESOURCE' ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={'/resources/' + log.refId}>查看资料</Link>
                      </Button>
                    ) : log.refType === 'ARTICLE' ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={'/articles/' + log.refId}>查看文章</Link>
                      </Button>
                    ) : log.refType === 'QUESTION' ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={'/qa/' + log.refId}>查看问题</Link>
                      </Button>
                    ) : null}
                  </motion.li>
                )
              })}
            </motion.ul>
          )
        ) : !data || data.exchanges.length === 0 ? (
          <EmptyState
            icon={<Download className="size-5" aria-hidden />}
            title="还没有兑换过资料"
            description="积分达到 5 分就能兑换一份技术资料，兑换后可无限次下载。"
            action={<Button asChild><Link to="/resources">去资源区看看</Link></Button>}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.exchanges.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={'/resources/' + item.resourceId} className="line-clamp-2 text-sm font-medium hover:text-primary">
                      {item.resourceTitle}
                    </Link>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.fileType} · 消耗 {item.pointsCost} 分 · {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">已拥有</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <a href={api.downloadUrl(item.resourceId)}>
                      <Download className="size-3.5" aria-hidden />
                      下载文件
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={'/resources/' + item.resourceId}>资料页</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  )
}
