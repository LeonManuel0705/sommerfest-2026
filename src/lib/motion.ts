import type { Transition, Variants } from 'framer-motion'

export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30 }
export const softSpring: Transition = { type: 'spring', stiffness: 200, damping: 26 }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: softSpring },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: spring },
}

export const tap = { scale: 0.96 }
export const hover = { scale: 1.03 }

export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.42, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
}
