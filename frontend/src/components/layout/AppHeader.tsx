import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { Check, CircleUser, Coins, LogOut, Monitor, Moon, PenLine, Search, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTheme } from '@/features/theme/ThemeProvider'
import type { Theme } from '@/features/theme/ThemeProvider'
import { useSearchController } from '@/features/search/SearchProvider'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'

interface NavItem {
  to: string
  label: string
  match: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '首页', match: (pathname) => pathname === '/' },
  {
    to: '/sections',
    label: '版块',
    match: (pathname) => pathname.startsWith('/sections') || pathname.startsWith('/s/'),
  },
  { to: '/qa', label: '问答', match: (pathname) => pathname.startsWith('/qa') },
  { to: '/resources', label: '资源', match: (pathname) => pathname.startsWith('/resources') },
  {
    to: '/me',
    label: '个人中心',
    match: (pathname) => pathname.startsWith('/me') || pathname.startsWith('/points'),
  },
]

const THEME_OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[hsl(212_96%_62%)] via-[hsl(214_90%_52%)] to-[hsl(218_86%_40%)] text-white shadow-[0_6px_16px_-8px_hsl(215_70%_30%_/_0.7)] ring-1 ring-inset ring-white/25',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="size-[22px]" fill="none">
        <path
          d="M20 8.6c1 1.9 3 3.1 5.3 2.9-1.1 1.9-3 3-5.3 3s-4.2-1.1-5.3-3c2.3.2 4.3-1 5.3-2.9Z"
          fill="currentColor"
          fillOpacity="0.55"
        />
        <path d="M10 17.6c3.2-1.1 6.6-.8 9.4 1.1v11.6c-2.8-1.9-6.2-2.2-9.4-1.1V17.6Z" fill="currentColor" />
        <path
          d="M30 17.6c-3.2-1.1-6.6-.8-9.4 1.1v11.6c2.8-1.9 6.2-2.2 9.4-1.1V17.6Z"
          fill="currentColor"
          fillOpacity="0.72"
        />
        <path
          d="M20 19.1v11.1"
          stroke="hsl(216 80% 32%)"
          strokeOpacity="0.45"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

function useScrolled(threshold = 6) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > threshold)
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [threshold])

  return scrolled
}

export function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const scrolled = useScrolled()
  const { open } = useSearchController()
  const { theme, resolved, setTheme } = useTheme()
  const { user, authenticated, points, loading, logout } = useAuth()

  const [isMac] = useState(() => {
    if (typeof navigator === 'undefined') return false
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
  })

  const currentThemeLabel = THEME_OPTIONS.find((option) => option.value === theme)?.label ?? '跟随系统'
  const ThemeIcon = resolved === 'dark' ? Moon : Sun

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('已退出登录')
      navigate('/')
    } catch {
      toast.error('退出登录失败，请稍后再试')
    }
  }

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className="app-header glass-2 sticky top-0 z-40 border-x-0 border-t-0"
    >
      <div className="relative mx-auto flex h-14 w-full max-w-[1240px] items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl py-1 pr-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="IT 学习天地 · 返回首页"
        >
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
              IT 学习天地
            </span>
            <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground lg:block">
              Learn · Share · Grow
            </span>
          </span>
        </Link>

        <nav
          aria-label="主导航"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.match(location.pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'relative flex h-9 items-center rounded-full px-3.5 text-[13.5px] transition-colors duration-200 lg:px-4',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="header-nav-pill"
                    className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-inset ring-primary/[0.15]"
                    transition={reduceMotion ? { duration: 0 } : spring.layout}
                  />
                ) : null}
                <span
                  aria-current={active ? 'page' : undefined}
                  className={cn('relative z-10', active && 'font-medium')}
                >
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => open()}
            aria-label="打开搜索"
            title="搜索"
            className="group inline-flex h-9 items-center gap-2 rounded-full border border-border/80 bg-card/70 px-2.5 text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Search className="size-[17px] shrink-0" aria-hidden="true" />
            <span className="hidden text-[13px] lg:inline">搜索</span>
            <kbd className="ml-1 hidden items-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-muted-foreground lg:inline-flex">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>

          {authenticated ? (
            <Link
              to="/points"
              aria-label={`积分中心，当前 ${points} 积分`}
              title="积分中心"
              className="hidden h-9 items-center gap-1.5 rounded-full bg-primary/[0.09] px-2.5 text-[13px] font-medium text-primary ring-1 ring-inset ring-primary/20 transition-colors hover:bg-primary/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:inline-flex"
            >
              <Coins className="size-[15px]" aria-hidden="true" />
              <span className="tabular-nums">{points.toLocaleString('zh-CN')}</span>
            </Link>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`切换主题，当前为${currentThemeLabel}`}
                title="切换主题"
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ThemeIcon className="size-[18px]" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-44">
              <DropdownMenuLabel>外观</DropdownMenuLabel>
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon
                const active = theme === option.value
                return (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => setTheme(option.value)}
                    className={cn(active && 'bg-accent/70 text-accent-foreground')}
                  >
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span>{option.label}</span>
                    {active ? <Check className="ml-auto size-4 text-primary" aria-hidden="true" /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {loading ? (
            <span className="ml-0.5 size-8 animate-pulse rounded-full bg-muted" aria-hidden="true" />
          ) : authenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${user.nickname} 的账号菜单`}
                  className="ml-0.5 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-[1.04] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar name={user.nickname} hue={user.avatarHue} size={30} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
                  <span className="text-sm font-semibold text-foreground">{user.nickname}</span>
                  <span className="text-xs font-normal text-muted-foreground">@{user.username}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/me" className="w-full">
                    <CircleUser className="size-4 text-muted-foreground" aria-hidden="true" />
                    个人中心
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/points" className="w-full">
                    <Coins className="size-4 text-muted-foreground" aria-hidden="true" />
                    积分中心
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/articles/new" className="w-full">
                    <PenLine className="size-4 text-muted-foreground" aria-hidden="true" />
                    发布文章
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    void handleLogout()
                  }}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-0.5 h-9 rounded-full px-4">
              <Link to="/login">登录</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader
