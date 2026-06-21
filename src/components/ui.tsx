import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/format'
import { spring, tap } from '@/lib/motion'
import { Radiolaria } from './icons'

export function GlassCard({
  children,
  className,
  solid,
  onInk,
}: {
  children: ReactNode
  className?: string
  solid?: boolean
  onInk?: boolean
}) {
  return (
    <div className={cx(onInk ? 'glass-ink' : solid ? 'glass-solid' : 'glass', 'rounded-[var(--radius-card)]', className)}>
      {children}
    </div>
  )
}

type Variant = 'primary' | 'accent' | 'gold' | 'ink' | 'glass' | 'ghost' | 'danger'
const variants: Record<Variant, string> = {
  primary: 'bg-moss-600 text-white shadow-[0_8px_22px_-10px_rgba(21,128,63,0.8)] hover:bg-moss-700',
  accent: 'bg-crimson-500 text-white shadow-[0_8px_22px_-10px_rgba(222,56,61,0.7)] hover:bg-crimson-600',
  gold: 'bg-gradient-to-b from-brass-300 to-brass-400 text-[#4a3508] shadow-[0_8px_22px_-10px_rgba(185,133,42,0.8)]',
  ink: 'bg-ink-800 text-white hairline-ink hover:bg-ink-700',
  glass: 'glass text-graphite hover:bg-white/80',
  ghost: 'text-graphite-soft hover:bg-graphite/[0.05] hover:text-graphite',
  danger: 'bg-crimson-500 text-white hover:bg-crimson-600',
}

export function Button({
  children,
  variant = 'primary',
  className,
  size = 'md',
  ...props
}: {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
} & HTMLMotionProps<'button'>) {
  const sizes = {
    sm: 'px-4 py-1.5 text-sm rounded-full gap-1.5',
    md: 'px-5 py-2.5 text-[15px] rounded-full gap-2',
    lg: 'px-6 py-3.5 text-base rounded-full gap-2',
  }
  return (
    <motion.button
      whileTap={props.disabled ? undefined : tap}
      whileHover={props.disabled ? undefined : { y: -1 }}
      transition={spring}
      className={cx(
        'sheen inline-flex items-center justify-center font-bold transition-colors select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:relative [&_svg]:z-[2]',
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function TextInput({
  label,
  className,
  ...props
}: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-semibold tracking-wide text-graphite-soft">{label}</span>
      )}
      <input
        className={cx(
          'w-full rounded-2xl border border-graphite/12 bg-white/70 px-4 py-3 text-[15px] font-medium text-graphite',
          'outline-none transition focus:border-moss-500 focus:bg-white focus:ring-4 focus:ring-moss-500/15',
          'placeholder:text-graphite-soft/50',
          className,
        )}
        {...props}
      />
    </label>
  )
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', className)}
    >
      {children}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-moss-500/25 border-t-moss-600',
        className,
      )}
    />
  )
}

export function EmblemLoader({ className, onInk = false }: { className?: string; onInk?: boolean }) {
  return (
    <Radiolaria
      spin
      className={cx('h-14 w-14', onInk ? 'text-moss-300/70' : 'text-moss-500/60', className)}
    />
  )
}

export function LivePill({ live, onInk = false }: { live: boolean; onInk?: boolean }) {
  return (
    <Badge
      className={cx(
        onInk ? 'bg-white/8 text-white/80 hairline-ink' : live ? 'bg-moss-500/12 text-moss-700' : 'bg-brass-400/15 text-brass-500',
      )}
    >
      <span className="relative flex h-2 w-2">
        {live && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-400 opacity-75" />
        )}
        <span className={cx('relative inline-flex h-2 w-2 rounded-full', live ? 'bg-moss-500' : 'bg-brass-400')} />
      </span>
      {live ? 'Live' : 'Verbinde…'}
    </Badge>
  )
}
