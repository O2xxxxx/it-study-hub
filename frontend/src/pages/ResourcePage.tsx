import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, CheckCircle2, Coins, Download, FileText, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { api, ApiError } from '@/lib/api'
import { cn, formatFileSize } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage, useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, LoginPrompt, PageShell, ScrollLink } from '@/features/common/ui'
import { paletteFor } from '@/features/common/sectionTheme'
import { AnimatedNumber } from '@/features/common/AnimatedNumber'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { panelVariants } from '@/lib/motion'

export default function ResourcePage() {
  const { id } = useParams()
  const resourceId = Number(id)
  const valid = Number.isFinite(resourceId) && resourceId > 0
  const state = useAsync(() => api.resource(resourceId), [resourceId, valid])
  const resource = state.data
  useDocumentTitle(resource?.title ?? '技术资料')

  const { authenticated, points, setBalance } = useAuth()
  const navigate = useNavigate()
  const [owned, setOwned] = useState(false)
  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const focusDownload = useRef(false)
  const downloadRef = useCallback((node: HTMLAnchorElement | null) => {
    if (node && focusDownload.current) {
      focusDownload.current = false
      node.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    if (resource) setOwned(resource.owned)
  }, [resource])

  if (!valid) {
    return (
      <PageShell>
        <EmptyState title="资料不存在" description="链接里的资料编号不正确。" action={<Button asChild><Link to="/resources">回到资源区</Link></Button>} />
      </PageShell>
    )
  }

  const needLogin = () => navigate('/login?redirect=' + encodeURIComponent('/resources/' + resourceId))

  const shortfall = resource ? Math.max(0, resource.points - points) : 0

  const handleExchangeOpenChange = (next: boolean) => {
    if (!authenticated) { needLogin(); return }
    if (busy) return
    if (next && shortfall > 0) {
      toast.error('还差 ' + shortfall + ' 积分，写一篇文章 +5 分，回答一个问题 +3 分')
      return
    }
    if (next) setDialogError('')
    setExchangeOpen(next)
  }

  const doExchange = async () => {
    setBusy(true)
    setDialogError('')
    try {
      const result = await api.exchange(resourceId)
      focusDownload.current = true
      setOwned(true)
      setBalance(result.balance)
      setExchangeOpen(false)
      setDialogError('')
      if (result.alreadyOwned) {
        toast.success('这份资料你已经兑换过，可以直接下载')
      } else {
        toast.success('-' + Math.abs(result.pointsDelta) + ' 积分，当前余额 ' + result.balance + ' 分')
      }
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'POINTS_NOT_ENOUGH' || err.message.includes('积分'))) {
        setDialogError(err.message || '积分不足')
      } else {
        setDialogError(errorMessage(err, '兑换失败，请重试'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell className="max-w-3xl" loading={state.loading && !resource}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ScrollLink to="/resources" className="inline-flex items-center gap-1 transition hover:text-primary">
          <ArrowLeft className="size-3" aria-hidden />
          资源区
        </ScrollLink>
        {resource ? (
          <>
            <span aria-hidden>/</span>
            <ScrollLink to={'/s/' + resource.sectionCode} className="transition hover:text-primary">{resource.sectionName}</ScrollLink>
          </>
        ) : null}
      </div>

      {state.loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : state.error ? (
        <ErrorBlock className="mt-6" message={state.error} onRetry={state.reload} />
      ) : !resource ? (
        <EmptyState className="mt-6" title="资料不存在" description="它可能已被下架。" />
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', paletteFor(resource.sectionCode).chip)}>
              {resource.sectionName}
            </span>
            <Badge variant="secondary" className="text-[10px]">{resource.fileType.toUpperCase()}</Badge>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <FileText className="size-3" aria-hidden />
              {formatFileSize(resource.fileSize)} · {resource.downloadCount} 次下载
            </span>
          </div>

          <h1 className="page-title mt-3 text-balance">{resource.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-md">
            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="size-3.5 text-primary" aria-hidden />
                兑换所需积分
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {resource.points}
                <span className="ml-1 text-xs font-normal text-muted-foreground">分</span>
              </p>
              {authenticated ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  当前余额 <AnimatedNumber value={points} /> 分
                </p>
              ) : null}
              {authenticated && !owned && shortfall > 0 ? (
                <p className="mt-0.5 text-[11px] text-destructive">还差 {shortfall} 分就能兑换</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <FavoriteButton targetType="resource" targetId={resource.id} initialFavorited={false} showLabel />
              <AnimatePresence mode="wait" initial={false}>
                {owned ? (
                  <motion.div
                    key="owned"
                    initial="closed" animate="open" exit="closed" variants={panelVariants}
                    className="flex items-center gap-2"
                  >
                    <Badge variant="success" className="gap-1 text-[11px]">
                      <CheckCircle2 className="size-3" aria-hidden />
                      已兑换
                    </Badge>
                    <Button asChild>
                      <a ref={downloadRef} href={api.downloadUrl(resource.id)}>
                        <Download className="size-4" aria-hidden />
                        下载文件
                      </a>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="exchange"
                    initial="closed" animate="open" exit="closed" variants={panelVariants}
                  >
                    <Popover open={exchangeOpen} onOpenChange={handleExchangeOpenChange}>
                      <PopoverTrigger asChild>
                        <Button aria-disabled={authenticated && shortfall > 0} className={authenticated && shortfall > 0 ? 'opacity-60' : undefined}>
                          {authenticated ? <Coins className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                          {authenticated ? '兑换资料' : '登录后兑换'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" side="top" sideOffset={10} className="w-72">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium">确认兑换这份资料？</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              扣除 {resource.points} 积分，兑换后可在本页和个人中心无限次下载。
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
                            <p className="flex items-center justify-between">
                              <span>当前余额</span>
                              <span className="tabular-nums text-foreground"><AnimatedNumber value={points} /> 分</span>
                            </p>
                            <p className="mt-1 flex items-center justify-between">
                              <span>兑换后余额</span>
                              <span className="tabular-nums text-foreground"><AnimatedNumber value={points - resource.points} /> 分</span>
                            </p>
                          </div>
                          {dialogError ? (
                            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
                              <p>{dialogError}</p>
                              <Link to="/qa" className="mt-1 inline-block font-medium underline underline-offset-2">
                                去回答一个问题赚 3 分
                              </Link>
                            </div>
                          ) : null}
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setExchangeOpen(false)} disabled={busy}>再想想</Button>
                            <Button size="sm" onClick={doExchange} loading={busy}>确认兑换</Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!authenticated ? (
            <LoginPrompt
              className="mt-4"
              title="游客可以看简介，兑换和下载需要登录"
              description="注册后发文章 +5、答题 +3，攒够 5 分就能兑换这份资料。"
              redirect={'/resources/' + resourceId}
            />
          ) : owned ? (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
              <Sparkles className="size-3" aria-hidden />
              已兑换的资料可以无限次下载，再次下载不会扣分。
            </p>
          ) : null}

          <div className="mt-8 rounded-xl border border-border/70 bg-muted/40 p-4">
            <h2 className="text-sm font-medium">资料说明</h2>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
              <li>· 文件下载后为 Markdown / 纯文本格式，可直接用编辑器打开</li>
              <li>· 兑换记录与扣分流水在同一事务内写入，重复点击不会重复扣分</li>
              <li>· 每份资料默认 5 积分，兑换前请确认余额</li>
            </ul>
          </div>
        </>
      )}

    </PageShell>
  )
}
