import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, PlusCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import type { QuestionCard } from '@/lib/types'
import { useAsync, useDebouncedValue, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, LoadingRows, PageHeading, PageShell, Pager, SectionSelect, Segmented } from '@/features/common/ui'
import { QuestionCardItem } from '@/features/questions/QuestionCard'

type FilterKey = 'all' | 'unsolved' | 'solved'

const PAGE_SIZE = 10

export default function QuestionsPage() {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sectionId, setSectionId] = useState<number | null>(null)
  const [keyword, setKeyword] = useState('')
  const [pageNo, setPageNo] = useState(1)
  const [retryKey, setRetryKey] = useState(0)
  const debouncedKeyword = useDebouncedValue(keyword, 250)

  const sections = useAsync(() => api.sections(), [])
  const sectionCode = sections.data?.find((section) => section.id === sectionId)?.code

  useEffect(() => {
    setPageNo(1)
  }, [filter, sectionId, debouncedKeyword])

  const list = useAsync(
    () =>
      api.questions({
        sectionCode,
        page: pageNo,
        size: PAGE_SIZE,
        filter,
      }),
    [sectionCode, pageNo, filter, retryKey],
  )

  useDocumentTitle('问答')

  const items: QuestionCard[] = (list.data?.items ?? []).filter((item) => {
    if (!debouncedKeyword.trim()) return true
    const needle = debouncedKeyword.trim().toLowerCase()
    return item.title.toLowerCase().includes(needle)
  })

  const solvedCount = sections.data?.reduce((sum, section) => sum + section.questionCount, 0) ?? 0

  return (
    <PageShell>
      <PageHeading
        eyebrow="问答"
        title="把卡住的问题说出来"
        description="提问不消耗积分，回答被采纳或被赞都能帮到别人；回答他人问题 +3 积分。"
        actions={
          <Button asChild>
            <Link to="/qa/new">
              <PlusCircle aria-hidden />
              我要提问
            </Link>
          </Button>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Segmented<FilterKey>
          value={filter}
          onChange={setFilter}
          layoutId="questions-filter-indicator"
          options={[
            { value: 'all', label: '全部' },
            { value: 'unsolved', label: '未解决' },
            { value: 'solved', label: '已解决' },
          ]}
        />
        <div className="w-40">
          <SectionSelect
            sections={sections.data ?? []}
            value={sectionId}
            onChange={setSectionId}
            disabled={sections.loading}
            className="h-9 text-xs"
          />
        </div>
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="按标题筛选（当前页）"
          className="h-9 w-52 text-xs"
          aria-label="按标题筛选当前页问题"
        />
        <span className="ml-auto text-xs text-muted-foreground">
          {list.data ? '共 ' + list.data.total + ' 个问题' : solvedCount > 0 ? '三个版块共 ' + solvedCount + ' 个问题' : ''}
        </span>
      </div>

      <div className="mt-5">
        {list.loading ? (
          <LoadingRows rows={5} />
        ) : list.error ? (
          <ErrorBlock message={list.error} onRetry={() => setRetryKey((value) => value + 1)} />
        ) : (list.data?.items ?? []).length === 0 ? (
          <EmptyState
            icon={<HelpCircle className="size-5" aria-hidden />}
            title={filter === 'solved' ? '还没有已解决的问题' : filter === 'unsolved' ? '暂时没有未解决的问题' : '还没有人提问'}
            description={filter === 'solved' ? '等第一个问题被采纳后会出现在这里。' : '第一个问题往往也是别人想问的。'}
            action={
              <Button asChild size="sm">
                <Link to="/qa/new">我要提问</Link>
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="当前页没有匹配的问题"
            description={'「' + keyword.trim() + '」不在本页标题里，可以翻页或用顶部搜索。'}
            action={
              <Button size="sm" variant="outline" onClick={() => setKeyword('')}>
                清空筛选
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((question) => (
              <motion.div
                key={question.id}
              >
                <QuestionCardItem question={question} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Pager className="mt-6" page={pageNo} totalPages={list.data?.totalPages ?? 1} onChange={setPageNo} />
    </PageShell>
  )
}
