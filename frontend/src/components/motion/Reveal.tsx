import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { duration, ease } from '@/lib/motion'

/**
 * 滚动进入视口时淡入上移。位移只在允许动效时发生，
 * prefers-reduced-motion 下退化为纯淡入。
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  once = true,
  amount = 0.2,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
  amount?: number
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once, amount, margin: '0px 0px -72px 0px' }}
      transition={
        reduce
          ? { duration: duration.feedback }
          : { duration: duration.state, ease: ease, delay }
      }
    >
      {children}
    </motion.div>
  )
}

export default Reveal
