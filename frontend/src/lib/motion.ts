import type { Transition } from 'motion/react'

export const DURATION = {
  instant: 0.09,
  fast: 0.18,
  base: 0.26,
  slow: 0.42,
  slower: 0.62,
} as const

export const EASE = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  springSoft: [0.34, 1.28, 0.5, 1] as const,
}

export const spring = {
  snappy: { type: 'spring', stiffness: 460, damping: 34, mass: 0.7 } as Transition,
  gentle: { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 } as Transition,
  soft: { type: 'spring', stiffness: 180, damping: 26, mass: 1 } as Transition,
  layout: { type: 'spring', stiffness: 380, damping: 38, mass: 0.8 } as Transition,
}

export const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: { duration: DURATION.base, ease: EASE.out },
}

export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: DURATION.base, ease: EASE.out },
}
