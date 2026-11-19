import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { duration as motionDuration, ease } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * 余额 / 统计数字的平滑滚动过渡：数字变化时从旧值补间到新值。
 */
export function AnimatedNumber({
  value,
  className,
  duration = motionDuration.panel,
  format,
}: {
  value: number
  className?: string
  duration?: number
  format?: (value: number) => string
}) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || previous.current === value) {
      previous.current = value
      setDisplay(value)
      return
    }
    const controls = animate(previous.current, value, {
      duration,
      ease,
      onUpdate: (latest: number) => {
        previous.current = latest
        setDisplay(Math.round(latest))
      },
    })
    return () => controls.stop()
  }, [value, duration, reduced])

  return <span className={cn('tabular-nums', className)}>{format ? format(display) : display}</span>
}
