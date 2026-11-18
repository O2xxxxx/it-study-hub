import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import type { Draft } from '@/lib/types'

export interface DraftValue {
  title: string
  sectionId: number | null
  contentMd: string
}

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface DraftAutosaveOptions {
  draftType: 'article' | 'question'
  draftKey: string
  /** 只有表单内容有变化时才自动保存（新建页在用户输入后启用）。 */
  enabled: boolean
  /** 进入页面时是否读取已存在的草稿。 */
  loadOnMount?: boolean
  /** 防抖间隔，默认 1200ms。 */
  delay?: number
}

/**
 * 草稿自动保存：1.2s 防抖调 PUT /api/drafts，进入页面 GET 草稿并对外暴露 restored。
 * 保存失败只反映在 status 上，不打断写作。
 */
export function useDraftAutosave({
  draftType,
  draftKey,
  enabled,
  loadOnMount = true,
  delay = 1200,
}: DraftAutosaveOptions) {
  const [restored, setRestored] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(loadOnMount)
  const [status, setStatus] = useState<DraftStatus>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  const pending = useRef<DraftValue | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    if (!loadOnMount) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setLoadError(false)
    api
      .getDraft(draftType, draftKey)
      .then((draft) => {
        if (!active) return
        setRestored(draft ?? null)
        setSavedAt(draft?.updatedAt ?? null)
      })
      .catch(() => {
        if (!active) return
        setLoadError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [draftType, draftKey, loadOnMount])

  const flush = useCallback(async () => {
    const value = pending.current
    if (!value) return
    pending.current = null
    setStatus('saving')
    try {
      const result = await api.saveDraft({
        draftType,
        draftKey,
        title: value.title.trim() || undefined,
        sectionId: value.sectionId ?? undefined,
        contentMd: value.contentMd,
      })
      if (!alive.current) return
      setStatus('saved')
      setSavedAt(result.updatedAt)
    } catch {
      if (alive.current) setStatus('error')
    }
  }, [draftType, draftKey])

  const save = useCallback(
    (value: DraftValue) => {
      if (!enabled) return
      const empty = !value.title.trim() && !value.contentMd.trim()
      if (empty) return
      pending.current = value
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        void flush()
      }, delay)
    },
    [enabled, flush, delay],
  )

  /** 发布 / 提交成功后清掉草稿。 */
  const clear = useCallback(async () => {
    pending.current = null
    if (timer.current) clearTimeout(timer.current)
    setStatus('idle')
    setSavedAt(null)
    try {
      await api.deleteDraft(draftType, draftKey)
    } catch {
      /* 草稿清理失败不影响主流程 */
    }
  }, [draftType, draftKey])

  return { restored, loading, status, savedAt, loadError, save, clear }
}
