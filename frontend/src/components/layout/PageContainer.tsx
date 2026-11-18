import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageWidth = 'default' | 'wide' | 'narrow'

const WIDTHS: Record<PageWidth, string> = {
  default: 'max-w-[1240px]',
  wide: 'max-w-[1400px]',
  narrow: 'max-w-[880px]',
}

export function PageContainer({
  children,
  className,
  width = 'default',
}: {
  children: ReactNode
  className?: string
  width?: PageWidth
}) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', WIDTHS[width], className)}>{children}</div>
  )
}

export default PageContainer
