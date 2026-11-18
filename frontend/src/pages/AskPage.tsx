import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage, useAsync, useDocumentTitle } from '@/features/common/hooks'
import { LoginPrompt, PageHeading, PageShell, SectionSelect } from '@/features/common/ui'
import { MarkdownEditor } from '@/features/markdown/MarkdownEditor'

export default function AskPage() {
  useDocumentTitle('我要提问')
  const { authenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const sections = useAsync(() => api.sections(), [])
  const [title, setTitle] = useState('')
  const [sectionId, setSectionId] = useState<number | null>(null)
  const [contentMd, setContentMd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (authLoading) {
    return <PageShell className="max-w-3xl"><p className="text-sm text-muted-foreground">正在检查登录状态…</p></PageShell>
  }

  if (!authenticated) {
    return (
      <PageShell className="max-w-2xl">
        <LoginPrompt
          title="登录后才能提问"
          description="提问不会消耗积分，但需要登录身份，这样别人回答时才知道问的是谁。"
          redirect="/qa/new"
        />
        <div className="mt-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/qa"><ArrowLeft className="size-3.5" aria-hidden />返回问答区</Link>
          </Button>
        </div>
      </PageShell>
    )
  }

  const submit = async () => {
    setError('')
    if (!title.trim()) { setError('请填写问题标题'); return }
    if (title.trim().length > 120) { setError('标题不要超过 120 个字'); return }
    if (sectionId === null) { setError('请选择所属版块'); return }
    if (!contentMd.trim()) { setError('请填写问题描述'); return }
    setSubmitting(true)
    try {
      const res = await api.askQuestion({ title: title.trim(), sectionId, contentMd })
      toast.success('问题已发布，去等一个回答吧')
      navigate('/qa/' + res.id, { replace: true })
    } catch (err) {
      const msg = errorMessage(err, '发布失败，请重试')
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell className="max-w-4xl">
      <PageHeading
        eyebrow="问答"
        title="我要提问"
        description="写清现象、关键代码和已尝试的方案，回答率会高很多。提问本身不加分也不扣分。"
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/qa"><ArrowLeft className="size-3.5" aria-hidden />返回列表</Link>
          </Button>
        }
      />

      <div className="mt-6 space-y-5 rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur-md sm:p-6">
        <div className="space-y-1.5">
          <Label htmlFor="q-title">问题标题</Label>
          <Input
            id="q-title"
            value={title}
            invalid={Boolean(error) && !title.trim()}
            maxLength={120}
            placeholder="例如：MySQL 联合索引为什么没有命中？"
            onChange={(event) => setTitle(event.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">最多 120 字，建议包含技术栈和具体现象</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="q-section">所属版块</Label>
          <SectionSelect
            id="q-section"
            sections={sections.data ?? []}
            value={sectionId}
            onChange={setSectionId}
            placeholder="请选择版块"
            invalid={Boolean(error) && sectionId === null}
          />
        </div>

        <div className="space-y-1.5">
          <Label>问题描述</Label>
          <MarkdownEditor
            value={contentMd}
            onChange={setContentMd}
            minHeight={260}
            placeholder={'贴上报错原文和关键代码，例如：\n\n执行 EXPLAIN 后 type=ALL，索引 idx_shop_status 没被用上。'}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            提问不消耗积分，回答他人问题 +3 分 · 每个问题每人只能回答一次
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/qa')} disabled={submitting}>取消</Button>
            <Button onClick={submit} loading={submitting}>
              <Send className="size-3.5" aria-hidden />
              发布问题
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
