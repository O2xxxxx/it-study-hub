import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AuthorLink({ username, className, children }: {
  username?: string
  className?: string
  children: ReactNode
}) {
  if (!username) return <span className={className}>{children}</span>
  return (
    <Link to={'/u/' + encodeURIComponent(username)}
      className={cn('relative z-10 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}>
      {children}
    </Link>
  )
}
