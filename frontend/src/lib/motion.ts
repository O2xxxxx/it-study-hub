import type { Transition, Variants } from 'motion/react'

export const duration = {
  feedback: 0.12,
  state: 0.18,
  panel: 0.24,
  close: 0.16,
  page: 0.32,
} as const

export const ease = [0.22, 1, 0.36, 1] as const

export const spring = {
  snappy: { type: 'spring', stiffness: 380, damping: 30 } satisfies Transition,
  gentle: { type: 'spring', stiffness: 320, damping: 26 } satisfies Transition,
  soft: { type: 'spring', stiffness: 260, damping: 22 } satisfies Transition,
}

export const overlayVariants: Variants = {
  closed: { opacity: 0, transition: { duration: duration.close, ease } },
  open: { opacity: 1, transition: { duration: duration.state, ease } },
}

export const panelVariants: Variants = {
  closed: { opacity: 0, scale: 0.97, y: 6, transition: { duration: duration.close, ease } },
  open: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.panel, ease } },
}

export const listItemVariants: Variants = {
  closed: { opacity: 0, y: 6, transition: { duration: duration.close, ease } },
  open: { opacity: 1, y: 0, transition: { duration: duration.state, ease } },
}

export const pageVariants: Variants = {
  closed: { opacity: 0, transition: { duration: duration.close, ease: 'easeIn' } },
  open: { opacity: 1, transition: { duration: duration.page, ease } },
}

export const fade = { initial: 'closed', animate: 'open', exit: 'closed', variants: listItemVariants }
