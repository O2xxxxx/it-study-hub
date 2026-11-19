import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArticleCardItem } from '@/features/articles/ArticleCard'
import { QuestionCardItem } from '@/features/questions/QuestionCard'
import { useAuth } from '@/features/auth/AuthProvider'
import { AnimatedNumber } from '@/features/common/AnimatedNumber'
import { errorMessage, useAsync, useDocumentTitle, useRestoreScroll } from '@/features/common/hooks'
import { ErrorBlock, LoadingRows, PageShell, Pager } from '@/features/common/ui'
import { ProfileLibrary } from '@/features/profile/ProfileLibrary'
import { api } from '@/lib/api'
import { spring } from '@/lib/motion'
import { formatDateTime } from '@/lib/utils'

export default function UserProfilePage() {
  const { username = '' } = useParams()
  return <UserProfile key={username} username={username} />
}

export function UserProfile({ username, ownRoute = false }: { username: string; ownRoute?: boolean }) {
  const { user, patchUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const reduced = useReducedMotion()
  const [tab, setTab] = useState('articles')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [nickname, setNickname] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const profile = useAsync(() => api.userProfile(username), [username, user?.id])
  const articles = useAsync(() => tab === 'articles' ? api.userArticles(username, page) : Promise.resolve(null),
    [username, page, tab, user?.id])
  const questions = useAsync(() => tab === 'questions' ? api.userQuestions(username, page) : Promise.resolve(null),
    [username, page, tab, user?.id])
  const data = profile.data
  useDocumentTitle(data?.nickname ?? '用户主页')
  useRestoreScroll(location.pathname, !profile.loading && !articles.loading && !questions.loading)

  async function toggleFollow() {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(location.pathname))
      return
    }
    if (!data || pending) return
    setPending(true)
    try {
      const result = await api.followUser(username, !data.followedByMe)
      profile.setData(current => current && {
        ...current, followedByMe: result.following, followerCount: result.followerCount, followingCount: result.followingCount,
      })
    } catch (error) {
      toast.error(errorMessage(error, '关注更新失败'))
    } finally {
      setPending(false)
    }
  }

  async function saveNickname(event: FormEvent) {
    event.preventDefault()
    if (!nickname.trim()) {
      setEditError('请输入昵称')
      return
    }
    setSaving(true)
    setEditError('')
    try {
      const result = await api.renameProfile(nickname.trim())
      patchUser({ nickname: result.nickname })
      profile.setData(current => current && { ...current, nickname: result.nickname })
      articles.reload()
      questions.reload()
      setEditOpen(false)
      toast.success('资料已更新')
    } catch (error) {
      setEditError(errorMessage(error, '保存失败'))
    } finally {
      setSaving(false)
    }
  }

  if (profile.loading) return <PageShell><LoadingRows rows={3} /></PageShell>
  if (!data) return <PageShell><ErrorBlock message={profile.error ?? '用户不存在'} onRetry={profile.reload} /></PageShell>
  const own = data.isSelf
  const library = ownRoute && own

  return (
    <PageShell className="max-w-5xl">
      <section className="border-b pb-8 md:pb-10" aria-label="用户资料">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-5">
          <Avatar name={data.nickname} hue={data.avatarHue} size={64} />
          <div className="min-w-0">
            <h1 className="page-title break-words">{data.nickname}</h1>
            <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">@{data.username}</p>
          </div>
          {own ? (
            <Dialog open={editOpen} onOpenChange={open => {
              setEditOpen(open)
              if (open) { setNickname(data.nickname); setEditError('') }
            }}>
              <DialogTrigger asChild><Button variant="outline">编辑资料</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑资料</DialogTitle>
                  <DialogDescription>修改主页显示的昵称。</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={saveNickname}>
                  <label className="block text-sm" htmlFor="profile-nickname">昵称</label>
                  <Input id="profile-nickname" value={nickname} maxLength={32} required
                    aria-invalid={!!editError} aria-describedby={editError ? 'profile-edit-error' : undefined}
                    onChange={event => setNickname(event.target.value)} />
                  {editError && <p id="profile-edit-error" role="alert" className="text-sm text-destructive">{editError}</p>}
                  <Button type="submit" loading={saving}>保存</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant={data.followedByMe ? 'outline' : 'default'} onClick={toggleFollow}
              loading={pending} aria-pressed={data.followedByMe}>
              {data.followedByMe ? '取消关注' : '关注'}
            </Button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm leading-6 text-muted-foreground">
          {data.createdAt && <span>{formatDateTime(data.createdAt).slice(0, 10)} 加入</span>}
          <span>文章 {data.articleCount}</span>
          <span>回答 {data.answerCount}</span>
          <Connections username={data.username} kind="followers" count={data.followerCount} />
          <Connections username={data.username} kind="following" count={data.followingCount} />
        </div>
        {own && (
          <Link to="/points" className="glass-1 mt-6 inline-flex h-10 items-center gap-3 rounded-lg px-4 text-sm leading-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Wallet className="size-4 text-primary" aria-hidden />
            积分明细
            <strong className="tabular-nums"><AnimatedNumber value={user?.points ?? data.points} /> 分</strong>
          </Link>
        )}
      </section>

      <Tabs value={tab} onValueChange={value => { setTab(value); setPage(1) }} className="mt-6">
        <TabsList aria-label="主页内容" className="max-w-full overflow-x-auto">
          <TabsTrigger value="articles" indicatorId="profile-tab">文章</TabsTrigger>
          <TabsTrigger value="questions" indicatorId="profile-tab">问答</TabsTrigger>
          {library && <TabsTrigger value="favorites" indicatorId="profile-tab">我的收藏</TabsTrigger>}
          {library && <TabsTrigger value="drafts" indicatorId="profile-tab">我的草稿</TabsTrigger>}
        </TabsList>
        <motion.div layout={reduced ? false : 'size'} transition={spring.gentle}>
          <TabsContent value="articles" className="min-h-48">
            {articles.loading ? <LoadingRows rows={3} /> : articles.error ? (
              <ErrorBlock message={articles.error} onRetry={articles.reload} />
            ) : articles.data?.items.length ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">{articles.data.items.map(post => <ArticleCardItem key={post.id} article={post} />)}</div>
                <Pager className="mt-6" page={page} totalPages={articles.data.totalPages} onChange={setPage} />
              </>
            ) : <EmptyState title="还没有发布文章" />}
          </TabsContent>
          <TabsContent value="questions" className="min-h-48">
            {questions.loading ? <LoadingRows rows={3} /> : questions.error ? (
              <ErrorBlock message={questions.error} onRetry={questions.reload} />
            ) : questions.data?.items.length ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">{questions.data.items.map(post => <QuestionCardItem key={post.id} question={post} />)}</div>
                <Pager className="mt-6" page={page} totalPages={questions.data.totalPages} onChange={setPage} />
              </>
            ) : <EmptyState title="还没有发布问题" />}
          </TabsContent>
          {library && <ProfileLibrary tab={tab} />}
        </motion.div>
      </Tabs>
    </PageShell>
  )
}

function Connections({ username, kind, count }: { username: string; kind: 'followers' | 'following'; count: number }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const label = kind === 'followers' ? '粉丝' : '关注'
  const list = useAsync(() => open ? api.userConnections(username, kind, page) : Promise.resolve(null),
    [open, username, kind, page, count])

  return (
    <Sheet open={open} onOpenChange={value => { setOpen(value); if (!value) setPage(1) }}>
      <SheetTrigger asChild>
        <button type="button" className="rounded-sm hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
          {label} <span className="tabular-nums">{count}</span>
        </button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
          <SheetDescription>@{username} 的{label}列表</SheetDescription>
        </SheetHeader>
        <div className="my-6">
          {list.loading ? <LoadingRows rows={3} /> : list.error ? (
            <ErrorBlock message={list.error} onRetry={list.reload} />
          ) : list.data?.items.length ? (
            <ul className="divide-y">
              {list.data.items.map(person => (
                <li key={person.id} className="py-3">
                  {person.deleted ? <span className="text-sm text-muted-foreground">{person.nickname}</span> : (
                    <Link to={'/u/' + encodeURIComponent(person.username)} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-md hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
                      <Avatar name={person.nickname} hue={person.avatarHue} size={32} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{person.nickname}</span>
                        <span className="block text-xs text-muted-foreground">@{person.username}</span>
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : <EmptyState title={'暂无' + label} />}
        </div>
        <Pager page={page} totalPages={list.data?.totalPages ?? 1} onChange={setPage} />
      </SheetContent>
    </Sheet>
  )
}
