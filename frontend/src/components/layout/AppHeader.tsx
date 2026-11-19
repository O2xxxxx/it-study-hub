import { useEffect, useRef, useState } from 'react'
import { BookOpen, CircleUserRound, LogIn, LogOut, PenLine, Search, Settings, Wallet } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/AuthProvider'
import { Segmented } from '@/features/common/ui'
import { useSearchController } from '@/features/search/SearchProvider'
import { useTheme, type Theme } from '@/features/theme/ThemeProvider'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

const navigation = [
  { to: '/', label: '首页', matches: (path: string) => path === '/' },
  { to: '/sections', label: '版块', matches: (path: string) => /^\/(sections|s\/|articles\/)/.test(path) },
  { to: '/qa', label: '问答', matches: (path: string) => path.startsWith('/qa') },
  { to: '/resources', label: '资源', matches: (path: string) => path.startsWith('/resources') },
]
const appearances: { value: Theme; label: string }[] = [
  { value: 'system', label: '系统' }, { value: 'light', label: '浅色' }, { value: 'dark', label: '深色' },
]

export function AppHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { open } = useSearchController()
  const accountTrigger = useRef<HTMLButtonElement>(null)
  const [settings, setSettings] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    setHeroVisible(pathname === '/')
    if (pathname !== '/') return
    // A route may be entering while the previous route is still animating out.
    let observer: IntersectionObserver | undefined
    const attach = () => {
      const search = document.getElementById('home-search')
      if (!search) return
      observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
        rootMargin: '-64px 0px 0px 0px',
      })
      observer.observe(search)
      wait.disconnect()
    }
    const wait = new MutationObserver(attach)
    wait.observe(document.getElementById('main-content') ?? document.body, { childList: true, subtree: true })
    attach()
    return () => { wait.disconnect(); observer?.disconnect() }
  }, [pathname])

  async function signOut() {
    try {
      await logout()
      navigate('/')
    } catch {
      toast.error('退出失败，请重试')
    }
  }

  return (
    <header className="glass-1 sticky top-0 z-40 rounded-none border-x-0 border-t-0">
      <div className="container grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <span className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-sm font-semibold leading-none tracking-tight md:text-base">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><BookOpen className="size-4" aria-hidden /></span>
          IT 学习天地
        </span>
        <nav aria-label="主导航" className="hidden items-center gap-2 md:flex">
          {navigation.map(item => {
            const active = item.matches(pathname)
            return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined}
              className={cn('relative isolate rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors',
                'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active && 'font-medium text-primary')}>
              {active && <motion.span layoutId="header-nav-pill" transition={spring.gentle}
                className="absolute inset-0 -z-10 rounded-full bg-primary/10" />}
              {item.label}
            </Link>
          })}
        </nav>
        <div className="flex shrink-0 items-center justify-self-end gap-2">
          <Button type="button" variant="ghost" size="icon" aria-label="打开搜索" onClick={() => open()}
            className={cn(pathname === '/' && heroVisible && 'invisible')}><Search className="size-5" aria-hidden /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={accountTrigger} type="button" variant="ghost" size="icon" className="rounded-full"
                aria-label={user ? user.nickname + ' 的账号菜单' : '账号菜单'}>
                {user ? <Avatar name={user.nickname} hue={user.avatarHue} size={30} />
                  : <CircleUserRound className="size-5" aria-hidden />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48" onCloseAutoFocus={event => {
              event.preventDefault()
              if (!settings) accountTrigger.current?.focus({ preventScroll: true })
            }}>
              {user ? <>
                <DropdownMenuItem asChild><Link to="/me"><CircleUserRound className="mr-2 size-4" />我的主页</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/articles/new"><PenLine className="mr-2 size-4" />写文章</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/points"><Wallet className="mr-2 size-4" />积分明细</Link></DropdownMenuItem>
              </> : <DropdownMenuItem asChild><Link to="/login"><LogIn className="mr-2 size-4" />登录</Link></DropdownMenuItem>}
              <DropdownMenuItem onSelect={() => setSettings(true)}><Settings className="mr-2 size-4" />设置</DropdownMenuItem>
              {user && <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { void signOut() }}><LogOut className="mr-2 size-4" />退出</DropdownMenuItem>
              </>}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={settings} onOpenChange={setSettings}>
            <DialogContent onCloseAutoFocus={event => {
              event.preventDefault()
              accountTrigger.current?.focus({ preventScroll: true })
            }}>
              <DialogHeader><DialogTitle>设置</DialogTitle><DialogDescription>选择界面外观。</DialogDescription></DialogHeader>
              <Segmented value={theme} options={appearances} onChange={setTheme} layoutId="appearance" />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
