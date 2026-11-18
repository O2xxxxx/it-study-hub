import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-24 text-center">
      <Compass className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">页面走丢了</h1>
      <p className="text-sm text-muted-foreground">你访问的地址不存在，回首页继续逛吧。</p>
      <Button asChild><Link to="/">回到首页</Link></Button>
    </div>
  )
}
