import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion/react'
import { DURATION, EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * 余额 / 统计数字的平滑滚动过渡：数字变化时从旧值补间到新值。
 */
export function AnimatedNumber({
  value,
  className,
  duration = DURATION.slower,
  format,
}: {
  value: number
  className?: string
  duration?: number
  format?: (value: number) => string
}) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    if (previous.current === value) {
      setDisplay(value)
      return
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: EASE.out as unknown as [number, number, number, number],
      onUpdate: (latest: number) => setDisplay(Math.round(latest)),
    })
    previous.current = value
    return () => controls.stop()
  }, [value, duration])

  return <span className={cn('tabular-nums', className)}>{format ? format(display) : display}</span>
}
