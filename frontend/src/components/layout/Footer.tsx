import { Link } from 'react-router-dom'
import { Heart, Mail } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'

const GROUPS = [
  {
    title: '学习',
    links: [
      { label: '技术文章', to: '/sections' },
      { label: '问答互助', to: '/qa' },
      { label: '资料库', to: '/resources' },
    ],
  },
  {
    title: '社区',
    links: [
      { label: '版块导航', to: '/sections' },
      { label: '积分中心', to: '/points' },
      { label: '个人中心', to: '/me' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card/60 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <PageContainer className="py-10 md:py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
          <div className="max-w-sm">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-lg text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-[hsl(213_95%_62%)] to-[hsl(216_88%_40%)] text-white shadow-sm">
                <svg viewBox="0 0 40 40" className="size-5" aria-hidden="true" fill="none">
                  <ellipse cx="20" cy="14" rx="9" ry="4.6" fill="currentColor" fillOpacity="0.55" />
                  <path d="M10 17.6c3.2-1.1 6.6-.8 9.4 1.1v11.6c-2.8-1.9-6.2-2.2-9.4-1.1V17.6Z" fill="currentColor" />
                  <path d="M30 17.6c-3.2-1.1-6.6-.8-9.4 1.1v11.6c2.8-1.9 6.2-2.2 9.4-1.1V17.6Z" fill="currentColor" fillOpacity="0.72" />
                </svg>
              </span>
              <span className="text-[15px] font-semibold tracking-tight">IT 学习天地</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              面向大学生的中文技术学习社区。写文章、答问题、换资料，把学到的东西留在这里。
            </p>
          </div>

          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.title}
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="inline-flex rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} IT 学习天地 · 内容仅供学习交流</p>
          <p className="flex items-center gap-1.5">
            <span>用</span>
            <Heart className="size-3.5 text-primary" aria-hidden="true" />
            <span>和一堆 token 养出来的</span>
            <span className="mx-1 h-3 w-px bg-border" aria-hidden="true" />
            <Mail className="size-3.5" aria-hidden="true" />
            <span>feedback@itstudy.local</span>
          </p>
        </div>
      </PageContainer>
    </footer>
  )
}

export default Footer
