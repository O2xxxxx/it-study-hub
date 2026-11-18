import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Bookmark,
  FileText,
  HelpCircle,
  LogOut,
  NotebookPen,
  PackageOpen,
  PenLine,
  Settings2,
  Trash2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import type { ArticleCard, Draft, FavoriteGroups, Page, QuestionCard } from '@/lib/types'
import { cn, formatDateTime, formatRelative } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage, useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, LoadingRows, PageShell, Segmented } from '@/features/common/ui'
import { AnimatedNumber } from '@/features/common/AnimatedNumber'
import { ArticleCardItem } from '@/features/articles/ArticleCard'
import { QuestionCardItem } from '@/features/questions/QuestionCard'
import { ResourceCardItem } from '@/features/resources/ResourceCard'
import { FAVORITE_CHANGED_EVENT, type FavoriteChangeDetail } from '@/features/favorites/FavoriteButton'
import { spring } from '@/lib/motion'

type TabKey = 'articles' | 'questions' | 'favorites' | 'drafts'
type FavoriteTab = 'article' | 'question' | 'resource'

const EMPTY_PAGE: Page<ArticleCard | QuestionCard> = { items: [], page: 1, size: 20, total: 0, totalPages: 0 }

async function loadDrafts(): Promise<Draft[]> {
  try {
    const raw = await api.get<unknown>('/api/drafts', { draftType: 'article' })
    const list = Array.isArray(raw)
      ? raw
      : raw && Array.isArray((raw as { items?: unknown[] }).items)
        ? ((raw as { items: unknown[] }).items ?? [])
        : []
    if (list.length > 0) return list as Draft[]
  } catch {
    // 契约里没有草稿列表接口，后端不支持时回退到读取新建草稿
  }
  try {
    const single = await api.getDraft('article', 'new')
    return single ? [single] : []
  } catch {
    return []
  }
}

export default function ProfilePage() {
  useDocumentTitle('个人中心')
  const { user, authenticated, loading: authLoading, logout, points } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('articles')
  const [favoriteTab, setFavoriteTab] = useState<FavoriteTab>('article')
  const [favoritesNonce, setFavoritesNonce] = useState(0)
  const [draftsNonce, setDraftsNonce] = useState(0)
  const [removedFavorites, setRemovedFavorites] = useState<string[]>([])
  const [deletingDraft, setDeletingDraft] = useState<string | null>(null)

  const favorites = useAsync<FavoriteGroups>(() => api.favorites(), [authenticated, favoritesNonce])
  const myArticles = useAsync<Page<ArticleCard>>(
    () =>
      user
        ? api.articles({ authorId: user.id, page: 1, size: 20, sort: 'latest' })
        : Promise.resolve(EMPTY_PAGE as Page<ArticleCard>),
    [user?.id],
  )
  const myQuestions = useAsync<Page<QuestionCard>>(
    () =>
      user
        ? api.questions({ authorId: user.id, page: 1, size: 20, filter: 'all' })
        : Promise.resolve(EMPTY_PAGE as Page<QuestionCard>),
    [user?.id],
  )
  const drafts = useAsync<Draft[]>(loadDrafts, [user?.id, draftsNonce])

  useEffect(() => {
    if (!authLoading && !authenticated) {
      navigate('/login?redirect=' + encodeURIComponent('/me'), { replace: true })
    }
  }, [authLoading, authenticated, navigate])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<FavoriteChangeDetail>).detail
      if (!detail) return
      if (detail.favorited) {
        setFavoritesNonce((n) => n + 1)
        return
      }
      const key = detail.targetType + ':' + detail.targetId
      setRemovedFavorites((prev) => (prev.includes(key) ? prev : prev.concat(key)))
    }
    window.addEventListener(FAVORITE_CHANGED_EVENT, handler)
    return () => window.removeEventListener(FAVORITE_CHANGED_EVENT, handler)
  }, [])

  if (authLoading) {
    return (
      <PageShell>
        <LoadingRows rows={4} />
      </PageShell>
    )
  }

  if (!authenticated || !user) {
    return (
      <PageShell className="max-w-2xl">
        <EmptyState
          icon={<Settings2 className="size-5" aria-hidden />}
          title="正在跳转到登录页"
          description="个人中心需要登录后才能查看。"
          action={
            <Button asChild>
              <Link to="/login?redirect=/me">去登录</Link>
            </Button>
          }
        />
      </PageShell>
    )
  }

  const groups = favorites.data
  const withoutRemoved = <T extends { id: number }>(list: T[], type: FavoriteTab): T[] =>
    list.filter((item) => !removedFavorites.includes(type + ':' + item.id))
  const myArticleList = (myArticles.data?.items ?? []).filter((item) => item.authorId === user.id)
  const myQuestionList = (myQuestions.data?.items ?? []).filter((item) => item.authorId === user.id)
  const favoriteArticles = withoutRemoved(groups?.article ?? [], 'article')
  const favoriteQuestions = withoutRemoved(groups?.question ?? [], 'question')
  const favoriteResources = withoutRemoved(groups?.resource ?? [], 'resource')

  const doLogout = async () => {
    try {
      await logout()
      toast.success('已退出登录')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, '退出失败'))
    }
  }

  const removeDraft = async (draft: Draft) => {
    const key = draft.draftKey
    setDeletingDraft(key)
    try {
      await api.deleteDraft(draft.draftType || 'article', key)
      toast.success('草稿已删除')
      setDraftsNonce((n) => n + 1)
    } catch (err) {
      toast.error(errorMessage(err, '删除草稿失败'))
    } finally {
      setDeletingDraft(null)
    }
  }

  return (
    <PageShell>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
        className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-start gap-5 p-6">
          <Avatar name={user.nickname} hue={user.avatarHue} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{user.nickname}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              @{user.username}
              {user.createdAt ? ' · 加入于 ' + formatDateTime(user.createdAt) : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/articles/new">
                  <PenLine className="size-3.5" aria-hidden />
                  写文章 +5
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/qa/new">
                  <HelpCircle className="size-3.5" aria-hidden />
                  去提问
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={doLogout}>
                <LogOut className="size-3.5" aria-hidden />
                退出登录
              </Button>
            </div>
          </div>
          <Link
            to="/points"
            className="group flex min-w-[190px] flex-col gap-1 rounded-xl border border-primary/25 bg-primary/[0.07] px-4 py-3 transition hover:border-primary/50 active:scale-[0.98]"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="size-3.5 text-primary" aria-hidden />
              我的积分
            </span>
            <span className="text-2xl font-semibold tabular-nums">
              <AnimatedNumber value={points} />
            </span>
            <span className="text-[11px] text-primary group-hover:underline">去积分中心</span>
          </Link>
        </div>
      </motion.section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="articles" indicatorId="profile-tab">
            我的文章
            {myArticleList.length > 0 ? <span className="text-[11px] text-muted-foreground">{myArticleList.length}</span> : null}
          </TabsTrigger>
          <TabsTrigger value="questions" indicatorId="profile-tab">
            我的问题
            {myQuestionList.length > 0 ? <span className="text-[11px] text-muted-foreground">{myQuestionList.length}</span> : null}
          </TabsTrigger>
          <TabsTrigger value="favorites" indicatorId="profile-tab">我的收藏</TabsTrigger>
          <TabsTrigger value="drafts" indicatorId="profile-tab">我的草稿</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="min-h-[220px]">
          {myArticles.error ? (
            <ErrorBlock message={myArticles.error} onRetry={myArticles.reload} />
          ) : myArticles.loading ? (
            <LoadingRows rows={3} />
          ) : myArticleList.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-5" aria-hidden />}
              title="还没有写过文章"
              description="写一篇技术文章 +5 积分，也能帮到后来的同学。"
              action={<Button asChild><Link to="/articles/new">写第一篇</Link></Button>}
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {myArticleList.map((article) => <ArticleCardItem key={article.id} article={article} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="min-h-[220px]">
          {myQuestions.error ? (
            <ErrorBlock message={myQuestions.error} onRetry={myQuestions.reload} />
          ) : myQuestions.loading ? (
            <LoadingRows rows={3} />
          ) : myQuestionList.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="size-5" aria-hidden />}
              title="还没有提过问题"
              description="提问不消耗积分，回答别人的问题 +3。"
              action={<Button asChild><Link to="/qa/new">我要提问</Link></Button>}
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {myQuestionList.map((question) => <QuestionCardItem key={question.id} question={question} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="min-h-[220px]">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Bookmark className="size-4 text-primary" aria-hidden />
              收藏的文章、问答和资源
            </p>
            <Segmented<FavoriteTab>
              layoutId="favorites-tab"
              value={favoriteTab}
              onChange={setFavoriteTab}
              options={[
                { value: 'article', label: '文章', count: favoriteArticles.length },
                { value: 'question', label: '问答', count: favoriteQuestions.length },
                { value: 'resource', label: '资源', count: favoriteResources.length },
              ]}
            />
          </div>

          <div className="mt-4">
            {favorites.error ? (
              <ErrorBlock message={favorites.error} onRetry={favorites.reload} />
            ) : favorites.loading ? (
              <LoadingRows rows={3} />
            ) : favoriteTab === 'article' ? (
              favoriteArticles.length === 0 ? (
                <EmptyState
                  icon={<Bookmark className="size-5" aria-hidden />}
                  title="还没有收藏文章"
                  description="在文章页点收藏，下次就能从这里直接打开。"
                  action={<Button asChild><Link to="/sections">去逛版块</Link></Button>}
                />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {favoriteArticles.map((item) => <ArticleCardItem key={item.id} article={item} />)}
                </div>
              )
            ) : favoriteTab === 'question' ? (
              favoriteQuestions.length === 0 ? (
                <EmptyState
                  icon={<Bookmark className="size-5" aria-hidden />}
                  title="还没有收藏问答"
                  description="在问答页点收藏，方便回头复习。"
                  action={<Button asChild><Link to="/qa">去问答区</Link></Button>}
                />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {favoriteQuestions.map((item) => <QuestionCardItem key={item.id} question={item} />)}
                </div>
              )
            ) : favoriteResources.length === 0 ? (
              <EmptyState
                icon={<PackageOpen className="size-5" aria-hidden />}
                title="还没有收藏资源"
                description="在资源页点收藏，攒够积分再兑换。"
                action={<Button asChild><Link to="/resources">去资源区</Link></Button>}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteResources.map((item) => <ResourceCardItem key={item.id} resource={item} />)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="min-h-[220px]">
          {drafts.error ? (
            <ErrorBlock message={drafts.error} onRetry={drafts.reload} />
          ) : drafts.loading ? (
            <LoadingRows rows={2} />
          ) : (drafts.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<NotebookPen className="size-5" aria-hidden />}
              title="没有未发布的草稿"
              description="写作台每 1.2 秒自动存一次草稿，离开也不会丢。"
              action={<Button asChild><Link to="/articles/new">开始写作</Link></Button>}
            />
          ) : (
            <ul className="space-y-2">
              {drafts.data?.map((draft) => {
                const isNew = draft.draftKey === 'new'
                return (
                  <li
                    key={draft.draftType + ':' + draft.draftKey}
                    className="flex flex-wrap items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {draft.title?.trim() || '未命名草稿'}
                        <Badge variant="secondary" className="text-[10px]">
                          {draft.draftType === 'question' ? '问答草稿' : '文章草稿'}
                        </Badge>
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {(draft.contentMd ?? '').slice(0, 160) || '还没有正文'}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {draft.updatedAt ? formatRelative(draft.updatedAt) : '刚刚'}保存
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={isNew ? '/articles/new' : '/articles/' + draft.draftKey + '/edit'}>
                          <PenLine className="size-3.5" aria-hidden />
                          继续编辑
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        loading={deletingDraft === draft.draftKey}
                        onClick={() => removeDraft(draft)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        删除
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <QuickLink to="/points" icon={Wallet} title="积分中心" desc="余额、流水、已兑换资源" />
        <QuickLink to="/resources" icon={PackageOpen} title="资源区" desc="用积分兑换技术资料" />
        <QuickLink to="/qa" icon={HelpCircle} title="问答区" desc="提问、回答、采纳" />
      </div>
    </PageShell>
  )
}

function QuickLink({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string
  icon: typeof FileText
  title: string
  desc: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-4 transition hover:border-primary/35 hover:bg-card active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className={cn('block text-sm font-medium group-hover:text-primary')}>{title}</span>
        <span className="block text-[11px] text-muted-foreground">{desc}</span>
      </span>
    </Link>
  )
}
