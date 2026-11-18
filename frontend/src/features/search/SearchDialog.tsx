import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDown, ArrowUp, CornerDownLeft, FileText, HelpCircle, Loader2, Package, Search, X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { SearchItem, SearchResponse, Section } from '@/lib/types'
import { errorMessage, useDebouncedValue } from '@/features/common/hooks'
import { Segmented } from '@/features/common/ui'
import { paletteFor } from '@/features/common/sectionTheme'
import { useSearchController } from './SearchProvider'

const TYPE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'article', label: '文章' },
  { value: 'question', label: '问答' },
  { value: 'resource', label: '资源' },
] as const

type SearchType = (typeof TYPE_OPTIONS)[number]['value']

const TYPE_ICON = { article: FileText, question: HelpCircle, resource: Package }
const TYPE_LABEL = { article: '文章', question: '问答', resource: '资源' }
const TYPE_ROUTE = { article: '/articles/', question: '/qa/', resource: '/resources/' }
const HINTS = ['索引', 'Spring', 'React', 'SQL', 'JVM']
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function SearchDialog() {
  const { isOpen, initialQuery, open, close } = useSearchController()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<SearchType>('all')
  const [sectionCode, setSectionCode] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [retryToken, setRetryToken] = useState(0)

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300)

  const flat = useMemo(() => {
    const items: SearchItem[] = []
    for (const group of data?.groups ?? []) items.push(...group.items)
    return items
  }, [data])

  // 打开时同步初始关键词并重置面板状态
  useEffect(() => {
    if (!isOpen) return
    setKeyword(initialQuery)
    setActiveIndex(0)
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen, initialQuery])

  // 版块筛选数据（打开后按需加载一次）
  useEffect(() => {
    if (!isOpen || sections.length > 0) return
    let alive = true
    api
      .sections()
      .then((list) => {
        if (alive) setSections(list)
      })
      .catch(() => {
        /* 版块筛选项加载失败不影响搜索本身 */
      })
    return () => {
      alive = false
    }
  }, [isOpen, sections.length])

  // 300ms 防抖请求
  useEffect(() => {
    if (!isOpen) return
    if (!debouncedKeyword) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    api
      .search({
        q: debouncedKeyword.slice(0, 40),
        type,
        sectionCode: sectionCode || undefined,
        limit: 12,
      })
      .then((response) => {
        if (alive) setData(response)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setError(errorMessage(err, '搜索失败，请稍后重试'))
        setData(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [debouncedKeyword, type, sectionCode, isOpen, retryToken])

  useEffect(() => {
    setActiveIndex(0)
  }, [data])

  // 全局快捷键：Ctrl/⌘ + K 打开，Esc 关闭
  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (isOpen) close()
        else open()
        return
      }
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, open, close])

  // 打开时锁滚动；关闭时还原滚动位置并把焦点还给触发按钮
  useEffect(() => {
    if (!isOpen) return
    const savedY = window.scrollY
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.documentElement.classList.add('overflow-hidden')
    return () => {
      document.documentElement.classList.remove('overflow-hidden')
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: 'auto' })
        trigger?.focus({ preventScroll: true })
      })
    }
  }, [isOpen])

  // 键盘选中的条目滚动到可视区域
  useEffect(() => {
    const container = listRef.current
    if (!container) return
    const node = container.querySelector<HTMLElement>('[data-search-index="' + activeIndex + '"]')
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const go = useCallback(
    (item: SearchItem) => {
      close()
      navigate(TYPE_ROUTE[item.type] + item.id)
    },
    [close, navigate],
  )

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (flat.length === 0 ? 0 : Math.min(flat.length - 1, index + 1)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(0, index - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = flat[activeIndex]
      if (item) go(item)
    }
  }

  const showInitial = !debouncedKeyword
  const showEmpty = !showInitial && !loading && !error && flat.length === 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent
        hideClose
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
        className={cn(
          'glass-3 top-[10vh] max-w-2xl translate-y-0 gap-0 overflow-hidden rounded-2xl border-border/70 bg-popover/95 p-0 backdrop-blur-2xl',
        )}
      >
        <DialogTitle className="sr-only">全站搜索</DialogTitle>
        <DialogDescription className="sr-only">
          搜索文章、问答与资源，方向键选择，回车打开，Esc 关闭。
        </DialogDescription>

        <div className="flex items-center gap-2 border-b border-border/70 px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={keyword}
            maxLength={40}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="搜索文章、问答、资源…"
            aria-label="搜索关键词"
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {keyword ? (
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                inputRef.current?.focus()
              }}
              aria-label="清空关键词"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
          <kbd className="hidden shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
            Esc
          </kbd>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-muted/25 px-4 py-2.5">
          <Segmented<SearchType>
            layoutId="search-type-indicator"
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          />
          <select
            value={sectionCode}
            onChange={(event) => setSectionCode(event.target.value)}
            aria-label="按版块筛选"
            className="ml-auto h-8 appearance-none rounded-lg border border-border/80 bg-card/80 px-2.5 text-xs text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">全部版块</option>
            {sections.map((section) => (
              <option key={section.code} value={section.code}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto overscroll-contain p-2">
          {loading ? (
            <div className="space-y-2 p-1" aria-live="polite">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-lg px-3 py-2.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="mt-2 h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center" role="alert">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setRetryToken((value) => value + 1)}>
                重试
              </Button>
            </div>
          ) : showInitial ? (
            <div className="px-3 py-6">
              <p className="text-xs font-medium text-muted-foreground">试试这些关键词</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {HINTS.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setKeyword(hint)}
                    className="rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-4" aria-hidden />
              </span>
              <p className="text-sm font-medium text-foreground">没有找到「{debouncedKeyword}」相关内容</p>
              <p className="text-xs text-muted-foreground">换个关键词，或把类型 / 版块切回「全部」再试。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.groups ?? []).map((group) => {
                const Icon = TYPE_ICON[group.type]
                return (
                  <section key={group.type} aria-label={group.label}>
                    <h3 className="flex items-center gap-1.5 px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Icon className="size-3" aria-hidden />
                      {group.label}
                      <span className="text-[10px] font-normal normal-case text-muted-foreground/80">
                        {group.items.length} 条
                      </span>
                    </h3>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const index = flat.indexOf(item)
                        const active = index === activeIndex
                        const palette = paletteFor(item.sectionCode)
                        return (
                          <button
                            key={item.type + '-' + item.id}
                            type="button"
                            data-search-index={index}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => go(item)}
                            aria-selected={active}
                            className={cn(
                              'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                              active ? 'bg-accent/80' : 'hover:bg-accent/40',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                                palette.chip,
                              )}
                            >
                              <Icon className="size-3.5" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline gap-2">
                                <span className={cn('truncate text-sm font-medium', active ? 'text-foreground' : 'text-foreground/90')}>
                                  {item.title}
                                </span>
                                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                                  {TYPE_LABEL[item.type]}
                                </span>
                              </span>
                              {item.snippet ? (
                                <span
                                  className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground [&_mark]:rounded-sm [&_mark]:bg-warning/25 [&_mark]:px-0.5 [&_mark]:text-foreground"
                                  dangerouslySetInnerHTML={{ __html: item.snippet }}
                                />
                              ) : (
                                <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                                  {item.summary}
                                </span>
                              )}
                              <span className="mt-1 block truncate text-[11px] text-muted-foreground/80">
                                {item.sectionName}
                                {item.meta ? ' · ' + item.meta : ''}
                              </span>
                            </span>
                            {active ? (
                              <CornerDownLeft className="mt-1 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/70 bg-muted/25 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="tabular-nums">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                搜索中…
              </span>
            ) : data ? (
              '共 ' + data.total + ' 条 · ' + data.elapsedMs + ' ms'
            ) : (
              '输入关键词开始搜索'
            )}
          </span>
          <span className="flex items-center gap-3">
            <span className="hidden items-center gap-1 sm:flex">
              <ArrowUp className="size-3" aria-hidden />
              <ArrowDown className="size-3" aria-hidden />
              选择
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <CornerDownLeft className="size-3" aria-hidden />
              打开
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-md border border-border bg-card px-1 py-0.5 text-[10px]">{IS_MAC ? '⌘' : 'Ctrl'}</kbd> K 呼出
            </span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog
