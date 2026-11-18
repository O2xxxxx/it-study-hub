import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, FileText, HelpCircle, Package } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAsync, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock, PageHeading, PageShell, ScrollLink } from '@/features/common/ui'
import { paletteFor, sectionIcon } from '@/features/common/sectionTheme'

export default function SectionsPage() {
  useDocumentTitle('版块')
  const sections = useAsync(() => api.sections(), [])

  return (
    <PageShell>
      <PageHeading
        eyebrow="全部内容"
        title="三个版块"
        description="Java 后端、数据库与前端三条主线，文章、问答、资源都按版块归档。"
      />

      {sections.loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="h-[240px] rounded-2xl" />)}
        </div>
      ) : sections.error ? (
        <ErrorBlock message={sections.error} onRetry={sections.reload} />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {(sections.data ?? []).map((section, index) => {
            const Icon = sectionIcon(section.icon)
            const palette = paletteFor(section.accent ?? section.code)
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.26 }}
              >
                <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 transition hover:border-primary/30 hover:shadow-glass">
                  <div className="flex items-center gap-3">
                    <span className={cn('flex size-11 items-center justify-center rounded-xl', palette.chip)}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold">{section.name}</h2>
                      <p className="text-xs text-muted-foreground">/{section.code}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {section.tagline || section.description}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                    <div>
                      <FileText className="mx-auto size-3.5 text-muted-foreground" aria-hidden />
                      <p className="mt-1 text-sm font-semibold tabular-nums">{section.articleCount}</p>
                      <p className="text-[11px] text-muted-foreground">文章</p>
                    </div>
                    <div>
                      <HelpCircle className="mx-auto size-3.5 text-muted-foreground" aria-hidden />
                      <p className="mt-1 text-sm font-semibold tabular-nums">{section.questionCount}</p>
                      <p className="text-[11px] text-muted-foreground">问答</p>
                    </div>
                    <div>
                      <Package className="mx-auto size-3.5 text-muted-foreground" aria-hidden />
                      <p className="mt-1 text-sm font-semibold tabular-nums">{section.resourceCount}</p>
                      <p className="text-[11px] text-muted-foreground">资源</p>
                    </div>
                  </div>

                  <ScrollLink
                    to={'/s/' + section.code}
                    className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary/10 text-sm font-medium text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                  >
                    进入版块
                    <ArrowRight className="size-4" aria-hidden />
                  </ScrollLink>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
        <span>找不到想要的内容？</span>
        <Link to="/qa/new" className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          提一个问题
        </Link>
        <span className="text-border">|</span>
        <Link to="/articles/new" className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          写一篇文章
        </Link>
      </div>
    </PageShell>
  )
}
