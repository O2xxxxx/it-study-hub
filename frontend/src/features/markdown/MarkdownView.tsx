import { useEffect, useMemo, useRef } from 'react'
import hljs from 'highlight.js/lib/common'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from './sanitize'
import './markdown.css'

async function copyText(text: string) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.top = '-1000px'
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    toast.success('代码已复制')
  } catch {
    toast.error('复制失败，请手动选择代码')
  }
}

/**
 * 渲染后端清洗后的 HTML，并给代码块补上高亮与「复制」按钮。
 */
export function MarkdownView({ html, className }: { html: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const safeHtml = useMemo(() => sanitizeHtml(html || ''), [html])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const blocks = Array.from(root.querySelectorAll('pre'))
    for (const pre of blocks) {
      const code = pre.querySelector('code')
      if (!code) continue
      try {
        hljs.highlightElement(code as HTMLElement)
      } catch {
        /* 未知语言时保留原文 */
      }
      if (pre.querySelector('.md-copy-btn')) continue
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'md-copy-btn'
      button.textContent = '复制'
      button.setAttribute('aria-label', '复制代码')
      button.addEventListener('click', () => {
        void copyText(code.textContent || '')
      })
      pre.appendChild(button)
    }
  }, [safeHtml])

  return <div ref={containerRef} className={cn('md-body', className)} dangerouslySetInnerHTML={{ __html: safeHtml }} />
}

export default MarkdownView
