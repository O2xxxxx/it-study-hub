import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, CheckCircle2, Sparkles, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage, useDocumentTitle } from '@/features/common/hooks'
import { ErrorBlock } from '@/features/common/ui'
import { fade } from '@/lib/motion'

interface FieldErrors {
  username?: string
  password?: string
  confirm?: string
  nickname?: string
}

const RULES = [
  '用户名 3-20 位字母、数字或下划线，全站唯一',
  '密码 6-32 位，服务端用 BCrypt 散列存储',
  '注册后积分从 0 开始，发文章和答题都能赚分',
]

export default function RegisterPage() {
  useDocumentTitle('注册')
  const { register, authenticated } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (authenticated) navigate(redirect, { replace: true })
  }, [authenticated, navigate, redirect])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const next: FieldErrors = {}
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username.trim())) next.username = '需为 3-20 位字母、数字或下划线'
    if (!nickname.trim()) next.nickname = '请填写昵称'
    else if (nickname.trim().length > 32) next.nickname = '昵称最长 32 个字符'
    if (password.length < 6 || password.length > 32) next.password = '密码长度需为 6-32 位'
    if (confirm !== password) next.confirm = '两次输入的密码不一致'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setPending(true)
    setError(null)
    try {
      await register(username.trim(), password, nickname.trim())
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(errorMessage(err, '注册失败，请稍后重试'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="container flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
      <motion.div
        {...fade}
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-lift backdrop-blur-xl lg:grid lg:grid-cols-[1fr_1.1fr]"
      >
        <div className="hidden flex-col justify-between gap-8 border-r border-border/60 bg-primary/[0.04] p-9 lg:flex">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">加入社区</p>
            <h2 className="mt-3 text-2xl font-semibold leading-snug">用真实的技术内容换积分</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              积分不是装饰：写文章、答问题会加分，兑换站内资料会扣分，每一笔都有流水可查。
            </p>
          </div>
          <ul className="space-y-3">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-7 sm:p-9">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="size-5" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">创建账号</h1>
          <p className="mt-1 text-sm text-muted-foreground">半分钟完成，注册即得 0 积分。</p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={username}
                  autoComplete="username"
                  invalid={!!errors.username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="字母/数字/下划线"
                />
                {errors.username ? <p className="text-xs text-destructive">{errors.username}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nickname">昵称</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  autoComplete="nickname"
                  invalid={!!errors.nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="社区里显示的名字"
                />
                {errors.nickname ? <p className="text-xs text-destructive">{errors.nickname}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete="new-password"
                  invalid={!!errors.password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 6 位"
                />
                {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">确认密码</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  autoComplete="new-password"
                  invalid={!!errors.confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="再输入一次"
                />
                {errors.confirm ? <p className="text-xs text-destructive">{errors.confirm}</p> : null}
              </div>
            </div>

            {error ? <ErrorBlock message={error} /> : null}

            <Button type="submit" className="w-full" loading={pending}>
              注册并进入
              {pending ? null : <ArrowRight aria-hidden />}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-2 text-xs">
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              已有账号，直接登录
            </Link>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Sparkles className="size-3.5" aria-hidden />
              发文章 +5 · 答题 +3
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
