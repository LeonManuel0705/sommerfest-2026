import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { cx } from '@/lib/format'

const FLAP_EASE = [0.3, 0, 0.2, 1] as const

function FlapCell({ char, index }: { char: string; index: number }) {
  return (
    <span
      className="relative grid place-items-center overflow-hidden rounded-[0.12em] font-mono tabular"
      style={{
        width: '0.82em',
        height: '1.18em',
        background: 'linear-gradient(#2c3832, #232d29)',
        color: '#f2efe6',
        boxShadow: 'var(--shadow-flap)',
      }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={char}
          initial={{ rotateX: -88, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 88, opacity: 0 }}
          transition={{ duration: 0.17, ease: FLAP_EASE, delay: index * 0.028 }}
          style={{ transformOrigin: 'center', backfaceVisibility: 'hidden' }}
          className="leading-none"
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      </AnimatePresence>
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ background: 'rgba(0,0,0,0.5)' }} />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[0.12em]" style={{ background: 'linear-gradient(rgba(255,255,255,0.06), transparent)' }} />
    </span>
  )
}

export function SplitFlap({
  value,
  digits = 0,
  roll = false,
  className,
}: {
  value: string | number
  digits?: number
  roll?: boolean
  className?: string
}) {
  const isNumber = typeof value === 'number'
  const [shown, setShown] = useState<number | string>(roll && isNumber ? 0 : value)
  const didRoll = useRef(false)

  useEffect(() => {
    if (roll && isNumber && !didRoll.current) {
      didRoll.current = true
      const controls = animate(0, value, {
        duration: 0.7,
        ease: 'easeOut',
        onUpdate: (v) => setShown(Math.round(v)),
      })
      return () => controls.stop()
    }
    setShown(value)
  }, [value, roll, isNumber])

  let chars: string[]
  if (isNumber) {
    const s = String(Math.round(Number(shown)))
    chars = (digits ? s.padStart(digits, ' ') : s).split('')
  } else {
    chars = String(shown).split('')
  }

  return (
    <span className={cx('inline-flex gap-[0.1em]', className)} style={{ perspective: '500px' }}>
      {chars.map((c, i) => (
        <FlapCell key={i} char={c} index={i} />
      ))}
    </span>
  )
}
