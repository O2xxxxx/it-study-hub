import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, KeyRound, LogIn, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock } from '@/features/common/ui'
import { fade, spring } from '@/lib/motion'

const DEMO = [
  { username: 'teacher', password: 'teach1234', note: '讲师，19 分' },
  { username: 'alice', password: 'alice1234', note: '会员，19 分' },
  { username: 'demo', password: 'demo1234', note: '0 分，演示积分不足' },
]

export default function LoginPage() {
  useDocumentTitle('登录')
  const { login, authenticated } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (authenticated) navigate(redirect, { replace: true })
  }, [authenticated, navigate, redirect])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const next: { username?: string; password?: string } = {}
    if (!username.trim()) next.username = '请输入用户名'
    if (!password) next.password = '请输入密码'
    setFieldErrors(next)
    if (Object.keys(next).length > 0) return
    setPending(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(errorMessage(err, '登录失败，请检查用户名和密码'))
    } finally {
      setPending(false)
    }
  }

  const fill = (name: string, pass: string) => {
    setUsername(name)
    setPassword(pass)
    setFieldErrors({})
    setError(null)
  }

  return (
    <div className="container flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-lift backdrop-blur-xl lg:grid lg:grid-cols-[1.05fr_1fr]"
      >
        <div className="hidden flex-col justify-between gap-8 border-r border-border/60 bg-primary/[0.04] p-9 lg:flex">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">IT 学习天地</p>
            <h2 className="mt-3 text-2xl font-semibold leading-snug text-foreground">
              登录后继续写文章、答题与兑换资料
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              发一篇技术文章得 5 分，回答一个别人没答过的问题得 3 分，积分可以兑换站内技术资料。
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">演示账号（点一下自动填入）</p>
            {DEMO.map((item) => (
              <button
                key={item.username}
                type="button"
                onClick={() => fill(item.username, item.password)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-left text-xs transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-mono text-foreground">{item.username} / {item.password}</span>
                <span className="text-muted-foreground">{item.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-7 sm:p-9">
          <motion.div {...fade}>
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LogIn className="size-5" aria-hidden />
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">欢迎回来</h1>
            <p className="mt-1 text-sm text-muted-foreground">用你的账号继续上次的学习进度。</p>
          </motion.div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username">用户名</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="username"
                  value={username}
                  autoComplete="username"
                  invalid={!!fieldErrors.username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="例如 alice"
                  className="pl-9"
                />
              </div>
              {fieldErrors.username ? <p className="text-xs text-destructive">{fieldErrors.username}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  invalid={!!fieldErrors.password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入密码"
                  className="pl-9"
                />
              </div>
              {fieldErrors.password ? <p className="text-xs text-destructive">{fieldErrors.password}</p> : null}
            </div>

            {error ? <ErrorBlock message={error} /> : null}

            <Button type="submit" className="w-full" loading={pending}>
              登录
              {pending ? null : <ArrowRight aria-hidden />}
            </Button>
          </form>

          <p className="mt-5 text-xs text-muted-foreground">
            还没有账号？
            <Link
              to={'/register' + (redirect !== '/' ? '?redirect=' + encodeURIComponent(redirect) : '')}
              className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              注册一个（注册即 0 积分）
            </Link>
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            游客也能浏览全部公开内容，只是发帖、回答、兑换与下载需要登录。
          </p>
        </div>
      </motion.div>
    </div>
  )
}
