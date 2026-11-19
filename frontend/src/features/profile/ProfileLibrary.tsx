import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, NotebookPen, PackageOpen, PenLine, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TabsContent } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import type { Draft, FavoriteGroups } from '@/lib/types'
import { formatRelative } from '@/lib/utils'
import { errorMessage, useAsync } from '@/features/common/hooks'
import { ErrorBlock, LoadingRows, Segmented } from '@/features/common/ui'
import { ArticleCardItem } from '@/features/articles/ArticleCard'
import { QuestionCardItem } from '@/features/questions/QuestionCard'
import { ResourceCardItem } from '@/features/resources/ResourceCard'
import { FAVORITE_CHANGED_EVENT } from '@/features/favorites/FavoriteButton'

type FavoriteTab = 'article' | 'question' | 'resource'

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

export function ProfileLibrary({ tab }: { tab: string }) {
  const [favoriteTab, setFavoriteTab] = useState<FavoriteTab>('article')
  const [draftsNonce, setDraftsNonce] = useState(0)
  const [deletingDraft, setDeletingDraft] = useState<string | null>(null)
  const favorites = useAsync<FavoriteGroups | null>(() => tab === 'favorites' ? api.favorites() : Promise.resolve(null), [tab])
  const drafts = useAsync<Draft[]>(() => tab === 'drafts' ? loadDrafts() : Promise.resolve([]), [tab, draftsNonce])
  const reloadFavorites = favorites.reload

  useEffect(() => {
    if (tab !== 'favorites') return
    window.addEventListener(FAVORITE_CHANGED_EVENT, reloadFavorites)
    return () => window.removeEventListener(FAVORITE_CHANGED_EVENT, reloadFavorites)
  }, [tab, reloadFavorites])

  const favoriteArticles = favorites.data?.article ?? []
  const favoriteQuestions = favorites.data?.question ?? []
  const favoriteResources = favorites.data?.resource ?? []

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
    <>
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
                        <Link to={draft.draftType === 'question' ? '/qa/new' : isNew ? '/articles/new' : '/articles/' + draft.draftKey + '/edit'}>
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
    </>
  )
}
