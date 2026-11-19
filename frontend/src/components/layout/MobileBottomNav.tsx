import { NavLink, useLocation } from 'react-router-dom'
import { CircleUser, FolderOpen, Home, LayoutGrid, MessagesSquare } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavItem {
  to: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
}

const ITEMS: MobileNavItem[] = [
  { to: '/', label: '首页', icon: Home, match: (pathname) => pathname === '/' },
  {
    to: '/sections',
    label: '版块',
    icon: LayoutGrid,
    match: (pathname) => pathname.startsWith('/sections') || pathname.startsWith('/s/'),
  },
  { to: '/qa', label: '问答', icon: MessagesSquare, match: (pathname) => pathname.startsWith('/qa') },
  {
    to: '/resources',
    label: '资源',
    icon: FolderOpen,
    match: (pathname) => pathname.startsWith('/resources'),
  },
  {
    to: '/me',
    label: '我的',
    icon: CircleUser,
    match: (pathname) => pathname.startsWith('/me') || pathname.startsWith('/points'),
  },
]

export function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav
      aria-label="移动端主导航"
      className="glass-2 fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.match(location.pathname)
          const Icon = item.icon
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className="group flex flex-col items-center gap-1 pb-1.5 pt-2 transition-transform motion-feedback active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    active ? 'bg-primary/[0.12] text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  <Icon className="size-[19px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                </span>
                <span
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'text-[10.5px] leading-none tracking-tight',
                    active ? 'font-medium text-primary' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
      <div className="safe-bottom" />
    </nav>
  )
}

export function MobileBottomNavSpacer() {
  return <div className="h-16 md:hidden" aria-hidden="true" />
}

export default MobileBottomNav
