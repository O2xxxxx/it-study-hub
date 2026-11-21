import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import { Bold, Code2, Heading2, Italic, List, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Segmented } from '@/features/common/ui'
import './markdown.css'

// 先 sanitize 再 highlight：清洗过的纯文本节点上只追加 className，安全且保留配色。
const remarkPlugins = [remarkGfm]
const rehypePlugins = [rehypeSanitize, rehypeHighlight]

type EditorTab = 'write' | 'preview'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
  invalid?: boolean
  id?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '支持 Markdown：## 标题、**加粗**、`行内代码`、代码块、列表、引用…',
  minHeight = 420,
  className,
  invalid,
  id,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState<EditorTab>('write')

  const insert = (before: string, after = '', fallback = '') => {
    const element = textareaRef.current
    if (!element) {
      onChange(value + before + fallback + after)
      return
    }
    const start = element.selectionStart ?? value.length
    const end = element.selectionEnd ?? value.length
    const selected = value.slice(start, end) || fallback
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    const caret = start + before.length + selected.length
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(caret, caret)
    })
  }

  const tools = [
    { key: 'h2', label: '标题', icon: Heading2, run: () => insert('## ', '', '小标题') },
    { key: 'bold', label: '加粗', icon: Bold, run: () => insert('**', '**', '加粗文字') },
    { key: 'italic', label: '斜体', icon: Italic, run: () => insert('_', '_', '斜体文字') },
    { key: 'code', label: '代码块', icon: Code2, run: () => insert('\n```java\n', '\n```\n', '// 在这里写代码') },
    { key: 'quote', label: '引用', icon: Quote, run: () => insert('> ', '', '引用内容') },
    { key: 'list', label: '列表', icon: List, run: () => insert('- ', '', '列表项') },
  ]

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
          {tools.map((tool) => (
            <Button
              key={tool.key}
              type="button"
              variant="ghost"
              size="icon-sm"
              title={tool.label}
              aria-label={tool.label}
              onClick={tool.run}
            >
              <tool.icon aria-hidden />
            </Button>
          ))}
        </div>
        <Segmented<EditorTab>
          className="lg:hidden"
          layoutId="markdown-editor-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'write', label: '编辑' },
            { value: 'preview', label: '预览' },
          ]}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={cn(tab === 'preview' && 'hidden lg:block')}>
          <label htmlFor={id} className="sr-only">
            正文 Markdown
          </label>
          <textarea
            id={id}
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-invalid={invalid || undefined}
            spellCheck={false}
            style={{ minHeight }}
            className={cn(
              'w-full resize-y rounded-xl border border-input bg-card/80 px-4 py-3 font-mono text-[13.5px] leading-relaxed text-foreground shadow-sm transition-colors',
              'placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              invalid && 'border-destructive focus-visible:ring-destructive',
            )}
          />
        </div>

        <div className={cn(tab === 'write' && 'hidden lg:block')}>
          <div
            style={{ minHeight }}
            className="md-body h-full overflow-auto rounded-xl border border-border/70 bg-card/50 px-4 py-3"
          >
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">预览会实时显示在这里。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor
