import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, CheckCircle2, CircleDashed, Eye, MessageSquare, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { Answer } from '@/lib/types'
import { cn, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage, useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, LoginPrompt, PageShell, ScrollLink } from '@/features/common/ui'
import { paletteFor } from '@/features/common/sectionTheme'
import { MarkdownView } from '@/features/markdown/MarkdownView'
import { MarkdownEditor } from '@/features/markdown/MarkdownEditor'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { spring } from '@/lib/motion'

export default function QuestionPage() {
  const { id } = useParams()
  const questionId = Number(id)
  const valid = Number.isFinite(questionId) && questionId > 0
  const state = useAsync(() => api.question(questionId), [questionId, valid])
  const question = state.data
  useDocumentTitle(question?.title ?? '问题')

  const { authenticated, applyPointsDelta } = useAuth()
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [accepting, setAccepting] = useState<Answer | null>(null)
  const [acceptBusy, setAcceptBusy] = useState(false)

  const answers = useMemo(() => {
    if (!question) return []
    return [...question.answers].sort((a, b) => Number(b.accepted) - Number(a.accepted) || a.id - b.id)
  }, [question])

  if (!valid) {
    return (
      <PageShell>
        <EmptyState
          title="问题不存在"
          description="链接里的问题编号不正确。"
          action={<Button asChild><Link to="/qa">回到问答区</Link></Button>}
        />
      </PageShell>
    )
  }

  const submitAnswer = async () => {
    if (!draft.trim()) { toast.error('回答内容不能为空'); return }
    setSubmitting(true)
    try {
      const res = await api.answerQuestion(questionId, draft)
      applyPointsDelta(res.pointsDelta, res.balance)
      toast.success('回答已提交，积分 +' + res.pointsDelta + '，当前 ' + res.balance + ' 分')
      setDraft('')
      state.reload()
    } catch (err) {
      toast.error(errorMessage(err, '回答提交失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmAccept = async () => {
    if (!accepting) return
    setAcceptBusy(true)
    try {
      await api.acceptAnswer(questionId, accepting.id)
      toast.success('已采纳这个回答，问题标记为已解决')
      setAccepting(null)
      state.reload()
    } catch (err) {
      toast.error(errorMessage(err, '采纳失败'))
    } finally {
      setAcceptBusy(false)
    }
  }

  return (
    <PageShell className="max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ScrollLink
          to="/qa"
          className="inline-flex items-center gap-1 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3" aria-hidden />
          问答区
        </ScrollLink>
        {question ? (
          <>
            <span aria-hidden>/</span>
            <ScrollLink to={'/s/' + question.section.code} className="transition hover:text-primary">
              {question.section.name}
            </ScrollLink>
          </>
        ) : null}
      </div>

      {state.loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : state.error ? (
        <ErrorBlock className="mt-6" message={state.error} onRetry={state.reload} />
      ) : !question ? (
        <EmptyState className="mt-6" title="问题不存在" description="它可能已被删除。" />
      ) : (
        <>
          <header className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', paletteFor(question.section.accent ?? question.section.code).chip)}>
                {question.section.name}
              </span>
              {question.solved ? (
                <Badge variant="success" className="gap-1 text-[10px]">
                  <CheckCircle2 className="size-2.5" aria-hidden />
                  已解决
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <CircleDashed className="size-2.5" aria-hidden />
                  待解决
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              {question.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-border/70 pb-4">
              <Avatar name={question.author.nickname} hue={question.author.avatarHue} size={32} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{question.author.nickname}</p>
                <p className="text-[11px] text-muted-foreground">提问于 {formatDateTime(question.createdAt)}</p>
              </div>
              <span className="inline-flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Eye className="size-3.5" aria-hidden />{question.viewCount} 次浏览</span>
                <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" aria-hidden />{question.answerCount} 个回答</span>
              </span>
              <div className="ml-auto">
                <FavoriteButton targetType="question" targetId={question.id} initialFavorited={question.favorite} showLabel />
              </div>
            </div>
          </header>

          <MarkdownView html={question.contentHtml} className="mt-6" />

          <section className="mt-10" aria-labelledby="answers-heading">
            <h2 id="answers-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              回答
              <span className="text-sm font-normal text-muted-foreground">{answers.length}</span>
            </h2>

            <div className="mt-4 space-y-3">
              {answers.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="size-5" aria-hidden />}
                  title="还没有人回答"
                  description="第一个回答的人能拿到 3 积分，也最容易被采纳。"
                />
              ) : (
                answers.map((answer) => (
                  <motion.article
                    key={answer.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring.soft}
                    className={cn(
                      'rounded-2xl border bg-card/70 p-5',
                      answer.accepted ? 'border-success/50 bg-success/[0.06] ring-1 ring-success/20' : 'border-border/70',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar name={answer.author.nickname} hue={answer.author.avatarHue} size={30} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {answer.author.nickname}
                          {answer.isMine ? <span className="ml-1 text-[11px] text-muted-foreground">（我）</span> : null}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{formatDateTime(answer.createdAt)}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        {answer.accepted ? (
                          <Badge variant="success" className="gap-1 text-[10px]">
                            <CheckCircle2 className="size-2.5" aria-hidden />
                            已采纳
                          </Badge>
                        ) : null}
                        {question.canAccept && !answer.accepted ? (
                          <Button size="sm" variant="outline" onClick={() => setAccepting(answer)}>
                            采纳这个回答
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <MarkdownView html={answer.contentHtml} className="mt-3" />
                  </motion.article>
                ))
              )}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="write-answer">
            <h2 id="write-answer" className="text-lg font-semibold tracking-tight">写回答</h2>
            {!authenticated ? (
              <LoginPrompt
                className="mt-3"
                title="登录后即可回答"
                description="每个会员对同一个问题只能提交一条回答，成功后积分 +3。"
                redirect={'/qa/' + questionId}
              />
            ) : !question.canAnswer ? (
              <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                {question.myAnswerId
                  ? '你已经回答过这个问题了。同一个问题只能提交一条有效回答，奖励也已发放。'
                  : '这是你自己提的问题，等别人来回答吧。'}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <MarkdownEditor
                  value={draft}
                  onChange={setDraft}
                  minHeight={220}
                  placeholder="给出可执行的排查思路或代码，尽量说明为什么这样做"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3 text-primary" aria-hidden />
                    提交后 +3 积分，采纳由提问者决定，不影响奖励
                  </p>
                  <Button onClick={submitAnswer} loading={submitting}>
                    <Send className="size-3.5" aria-hidden />
                    提交回答
                  </Button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      <Dialog open={Boolean(accepting)} onOpenChange={(open) => { if (!open) setAccepting(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>采纳这个回答？</DialogTitle>
            <DialogDescription>
              采纳后问题会标记为已解决，被采纳的回答会排在详情页最前面。采纳不会额外加分，也不会扣分。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-40 overflow-hidden rounded-lg border border-border/70 bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            {(accepting?.contentMd ?? '').slice(0, 160)}
            {(accepting?.contentMd ?? '').length > 160 ? '…' : ''}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccepting(null)} disabled={acceptBusy}>再想想</Button>
            <Button onClick={confirmAccept} loading={acceptBusy}>确认采纳</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
