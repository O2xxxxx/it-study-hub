import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileText, Loader2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { api, ApiError } from '@/lib/api'
import { cn, formatRelative } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync, useDocumentTitle, errorMessage, isUnauthorized } from '@/features/common/hooks'
import { ErrorBlock, LoginPrompt, PageShell, SectionSelect } from '@/features/common/ui'
import { MarkdownEditor } from '@/features/markdown/MarkdownEditor'
import { useDraftAutosave } from '@/features/editor/useDraftAutosave'

interface FormState {
  title: string
  sectionId: number | null
  contentMd: string
}

interface FieldErrors {
  title?: string
  sectionId?: string
  contentMd?: string
}

const EMPTY: FormState = { title: '', sectionId: null, contentMd: '' }

export default function ArticleEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, applyPointsDelta } = useAuth()
  const editingId = id ? Number(id) : null
  const isEdit = Boolean(editingId)
  const validId = !isEdit || (Number.isFinite(editingId) && (editingId as number) > 0)
  const draftKey = isEdit ? String(editingId) : 'new'

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null)
  const hydrated = useRef(false)

  const sections = useAsync(() => api.sections(), [])
  const article = useAsync(
    () => (isEdit && validId ? api.article(editingId as number) : Promise.resolve(null)),
    [editingId, isEdit, validId],
  )

  const draft = useDraftAutosave({
    draftType: 'article',
    draftKey,
    enabled: dirty && !submitting && Boolean(user),
    loadOnMount: Boolean(user) && validId,
  })

  useDocumentTitle(isEdit ? '编辑文章' : '写文章')

  // 编辑模式：先落已有文章内容，再把草稿叠加进来。
  useEffect(() => {
    if (!isEdit || hydrated.current || !article.data) return
    hydrated.current = true
    setForm({
      title: article.data.title,
      sectionId: article.data.section.id,
      contentMd: article.data.contentMd,
    })
  }, [article.data, isEdit])

  useEffect(() => {
    if (draft.loading || !draft.restored) return
    if (isEdit && !hydrated.current) return
    if (isEdit) {
      const data = article.data
      if (!data) return
      const same =
        draft.restored.contentMd === data.contentMd &&
        (draft.restored.title ?? data.title) === data.title
      if (same) return
      setForm({
        title: draft.restored.title ?? data.title,
        sectionId: draft.restored.sectionId ?? data.section.id,
        contentMd: draft.restored.contentMd,
      })
      setRestoredNotice('已恢复上次草稿')
      toast.info('已恢复上次草稿')
      return
    }
    hydrated.current = true
    setForm({
      title: draft.restored.title ?? '',
      sectionId: draft.restored.sectionId ?? null,
      contentMd: draft.restored.contentMd ?? '',
    })
    setRestoredNotice('已恢复上次草稿')
    toast.info('已恢复上次草稿')
  }, [draft.loading, draft.restored, article.data, isEdit])

  const update = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }

  useEffect(() => {
    if (!dirty) return
    draft.save(form)
  }, [form, dirty, draft])

  const validate = () => {
    const next: FieldErrors = {}
    if (!form.title.trim()) next.title = '请填写标题'
    else if (form.title.trim().length > 120) next.title = '标题最多 120 个字'
    if (!form.sectionId) next.sectionId = '请选择版块'
    if (!form.contentMd.trim()) next.contentMd = '正文不能为空'
    else if (form.contentMd.trim().length < 10) next.contentMd = '正文太短了，至少写 10 个字'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (submitting) return
    if (!validate()) {
      toast.error('表单还有问题，按提示改一下')
      return
    }
    setSubmitting(true)
    try {
      if (isEdit) {
        await api.updateArticle(editingId as number, {
          title: form.title.trim(),
          sectionId: form.sectionId as number,
          contentMd: form.contentMd,
        })
        await draft.clear()
        toast.success('文章已更新')
        navigate('/articles/' + editingId)
        return
      }
      const result = await api.createArticle({
        title: form.title.trim(),
        sectionId: form.sectionId as number,
        contentMd: form.contentMd,
      })
      const delta = typeof result?.pointsDelta === 'number' ? result.pointsDelta : 5
      await draft.clear()
      if (delta > 0) {
        toast.success('发布成功，+' + delta + ' 积分')
        applyPointsDelta(delta, result?.balance)
      } else {
        toast.success('发布成功')
      }
      setDirty(false)
      navigate(result?.id ? '/articles/' + result.id : '/')
    } catch (error) {
      if (error instanceof ApiError && isUnauthorized(error)) {
        toast.error('请先登录', { description: '登录后才能发布文章。' })
        navigate('/login?redirect=' + encodeURIComponent(isEdit ? '/articles/' + editingId + '/edit' : '/articles/new'))
        return
      }
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const details = (error.details ?? {}) as Record<string, unknown>
        const fieldErrors = (details.fieldErrors ?? {}) as Record<string, string>
        setErrors({
          title: fieldErrors.title,
          sectionId: fieldErrors.sectionId,
          contentMd: fieldErrors.contentMd,
        })
      }
      toast.error(errorMessage(error, isEdit ? '保存失败，请重试' : '发布失败，请重试'))
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <PageShell className="max-w-5xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="mt-4 h-[420px] w-full" />
      </PageShell>
    )
  }

  if (!user) {
    return (
      <PageShell className="max-w-3xl">
        <LoginPrompt
          title="登录后才能写作"
          description="写文章发布成功可获 5 积分，草稿会自动保存在服务器。"
          redirect={isEdit ? '/articles/' + editingId + '/edit' : '/articles/new'}
        />
      </PageShell>
    )
  }

  if (isEdit && (!validId || article.error)) {
    return (
      <PageShell className="max-w-3xl">
        <ErrorBlock message={article.error ?? '文章编号不正确'} onRetry={() => navigate('/')} />
      </PageShell>
    )
  }

  const articleLoading = isEdit && article.loading
  const canEdit = !isEdit || article.data?.canEdit !== false
  const wordCount = form.contentMd.trim().length

  return (
    <PageShell className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to={isEdit ? '/articles/' + editingId : '/'}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3" aria-hidden />
            {isEdit ? '返回文章' : '返回首页'}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{isEdit ? '编辑文章' : '写文章'}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Markdown 写作，右侧实时预览；草稿每 1.2 秒自动保存。
            {!isEdit ? ' 发布成功 +5 积分。' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {draft.status === 'saving' ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" aria-hidden />
              保存草稿中
            </span>
          ) : draft.status === 'saved' ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" aria-hidden />
              草稿已保存{savedHint(draft.savedAt)}
            </span>
          ) : draft.status === 'error' ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-destructive">
              <Save className="size-3" aria-hidden />
              草稿保存失败
            </span>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <Link to={isEdit ? '/articles/' + editingId : '/'}>取消</Link>
          </Button>
        </div>
      </div>

      {restoredNotice ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-3.5" aria-hidden />
            {restoredNotice}
          </span>
          <button
            type="button"
            className="rounded-md text-[11px] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setRestoredNotice(null)}
          >
            知道了
          </button>
        </div>
      ) : null}

      {articleLoading ? (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[460px] w-full" />
        </div>
      ) : !canEdit ? (
        <div className="mt-6 rounded-xl border border-border/70 bg-card/60 p-6 text-sm text-muted-foreground">
          只有作者本人可以编辑这篇文章。
          <Button asChild variant="link" size="sm" className="ml-1 px-0">
            <Link to={'/articles/' + editingId}>回到文章</Link>
          </Button>
        </div>
      ) : (
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="space-y-1.5">
              <Label htmlFor="article-title">标题</Label>
              <Input
                id="article-title"
                value={form.title}
                onChange={(event) => update({ title: event.target.value })}
                placeholder="例如：Spring Security 里 JWT 拦截器的正确写法"
                invalid={Boolean(errors.title)}
                maxLength={120}
                autoComplete="off"
              />
              {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="article-section">版块</Label>
              <SectionSelect
                id="article-section"
                sections={sections.data ?? []}
                value={form.sectionId}
                onChange={(value) => update({ sectionId: value })}
                invalid={Boolean(errors.sectionId)}
                placeholder="选择版块"
                disabled={sections.loading}
              />
              {errors.sectionId ? <p className="text-xs text-destructive">{errors.sectionId}</p> : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="article-content">正文</Label>
              <span className="text-[11px] tabular-nums text-muted-foreground">{wordCount} 字</span>
            </div>
            <MarkdownEditor
              id="article-content"
              value={form.contentMd}
              onChange={(value) => update({ contentMd: value })}
              minHeight={440}
              invalid={Boolean(errors.contentMd)}
            />
            {errors.contentMd ? <p className="text-xs text-destructive">{errors.contentMd}</p> : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {!isEdit ? <Badge variant="secondary">发布成功 +5 积分</Badge> : <Badge variant="outline">修改不加分</Badge>}
              <span className={cn('hidden sm:inline', draft.status === 'error' && 'text-destructive')}>
                草稿自动保存到「我的草稿」
              </span>
            </div>
            <Button type="submit" loading={submitting}>
              {submitting ? null : isEdit ? <Save aria-hidden /> : <Send aria-hidden />}
              {isEdit ? '保存修改' : '发布文章'}
            </Button>
          </div>
        </form>
      )}
    </PageShell>
  )
}

function savedHint(updatedAt: string | null) {
  if (!updatedAt) return ''
  return ' · ' + formatRelative(updatedAt)
}