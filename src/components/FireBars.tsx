import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import type { LeaderboardRow } from '@/lib/types'
import { cx, fmt, rankMap, rankSweepColor } from '@/lib/format'
import { AnimatedNumber } from './AnimatedNumber'

const reorder = { type: 'spring' as const, stiffness: 320, damping: 34 }
const heightBounce = { type: 'spring' as const, stiffness: 230, damping: 18, mass: 0.85 }
const squashEase = [0.33, 0, 0.17, 1] as const

type Pulse = { key: number; dir: 1 | -1; delta: number }

function niceStep(raw: number) {
  const exp = Math.floor(Math.log10(raw))
  const base = Math.pow(10, exp)
  const m = raw / base
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * base
}

export function FireBars({ rows, big = false, chartH }: { rows: LeaderboardRow[]; big?: boolean; chartH?: number }) {
  const ranks = rankMap(rows)
  const total = rows.length
  const max = Math.max(1, ...rows.map((r) => r.gesamt))
  const H = chartH ?? (big ? 340 : 220)
  const labelArea = big ? 54 : 40
  const headroom = big ? 52 : 34
  const trackPx = Math.max(40, H - labelArea - headroom)
  const step = Math.max(1, niceStep(max / 5))
  const gridLines = max > 1 ? Array.from({ length: Math.floor(max / step) }, (_, i) => (i + 1) * step) : []

  return (
    <div className="relative flex w-full min-w-max items-end justify-center gap-1.5 sm:gap-3" style={{ height: H }}>
      {gridLines.length > 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          {gridLines.map((v) => (
            <div key={v} className="absolute inset-x-0 border-t border-graphite/[0.08]" style={{ bottom: labelArea + (v / max) * trackPx }}>
              <span className={cx('absolute bottom-0.5 left-0 font-semibold tabular text-graphite-soft/40', big ? 'text-xs' : 'text-[9px]')}>{fmt(v)}</span>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence initial={false}>
        {rows.map((row, i) => {
          const rank = ranks.get(row.team_id) ?? i + 1
          const sweep = rankSweepColor(i, total)
          const pct = row.gesamt > 0 ? Math.max(2.5, (row.gesamt / max) * 100) : 0
          const barPx = Math.round((pct / 100) * trackPx)
          return (
            <motion.div
              key={row.team_id}
              layout
              layoutId={row.team_id}
              transition={reorder}
              className="relative z-[1] flex min-w-[18px] flex-1 flex-col items-center gap-2"
              style={{ maxWidth: big ? 84 : 54 }}
            >
              <Bar row={row} sweep={sweep} leader={rank === 1} barPx={barPx} trackPx={trackPx} big={big} index={i} />
              <div className="flex w-full flex-col items-center gap-1">
                <span className="shrink-0 rounded-full ring-1 ring-black/10" style={{ width: big ? 12 : 8, height: big ? 12 : 8, background: row.farbe }} />
                <span className={cx('w-full truncate text-center font-semibold text-graphite', big ? 'text-xs sm:text-base' : 'text-[10px]')} title={row.name}>
                  {row.name}
                </span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function Bar({
  row,
  sweep,
  leader,
  barPx,
  trackPx,
  big,
  index,
}: {
  row: LeaderboardRow
  sweep: string
  leader: boolean
  barPx: number
  trackPx: number
  big: boolean
  index: number
}) {
  const controls = useAnimationControls()
  const prev = useRef(row.gesamt)
  const firstBarPx = useRef(barPx)
  const skipFirstRescale = useRef(true)
  const [pulse, setPulse] = useState<Pulse | null>(null)

  useEffect(() => {
    controls.set({ height: 0, scaleY: 1 })
    controls.start({ height: firstBarPx.current }, { type: 'spring', stiffness: 150, damping: 20, delay: 0.12 + index * 0.05 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (skipFirstRescale.current) {
      skipFirstRescale.current = false
      return
    }
    controls.start({ height: barPx }, heightBounce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barPx])

  useEffect(() => {
    if (row.gesamt === prev.current) return
    const delta = Math.round((row.gesamt - prev.current) * 100) / 100
    const dir: 1 | -1 = delta >= 0 ? 1 : -1
    setPulse((p) => ({ key: (p?.key ?? 0) + 1, dir, delta }))
    controls.start(
      { scaleY: dir > 0 ? [1, 1.09, 0.97, 1] : [1, 0.93, 1.03, 1] },
      { duration: 0.52, times: [0, 0.3, 0.6, 1], ease: squashEase },
    )
    prev.current = row.gesamt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.gesamt])

  const up = (pulse?.dir ?? 1) > 0
  const glow = up ? 'rgba(16,185,129,0.55)' : 'rgba(100,116,139,0.5)'

  return (
    <div className="relative w-full" style={{ height: trackPx }}>
      {pulse && (
        <motion.div
          key={`glow-${pulse.key}`}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: big ? 90 : 56, height: Math.min(trackPx, barPx + 40), background: `radial-gradient(circle at 50% 90%, ${glow}, transparent 70%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      )}

      <motion.div
        initial={{ height: 0 }}
        animate={controls}
        className="absolute bottom-0 inset-x-0 mx-auto overflow-hidden rounded-full"
        style={{
          maxWidth: big ? 50 : 30,
          transformOrigin: 'bottom',
          background: `linear-gradient(0deg, #047857 0%, ${sweep} 100%)`,
          boxShadow: leader ? '0 0 24px rgba(16,185,129,0.55)' : '0 0 10px rgba(16,185,129,0.28)',
        }}
      >
        {barPx > trackPx * 0.06 && <div className="fire-glint" style={{ animationDelay: `${(index % 6) * 0.3}s` }} />}
      </motion.div>

      <motion.div
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: -(barPx + 4), opacity: 1 }}
        transition={heightBounce}
        className={cx('absolute inset-x-0 bottom-0 text-center font-bold tabular text-graphite', big ? 'text-lg' : 'text-[11px]')}
      >
        <motion.span key={pulse?.key ?? 'n'} animate={pulse ? { scale: [1, 1.22, 1] } : undefined} transition={{ duration: 0.45, ease: 'easeOut' }} className="inline-block">
          <AnimatedNumber value={row.gesamt} />
        </motion.span>
      </motion.div>

      <AnimatePresence>
        {pulse && pulse.delta !== 0 && (
          <motion.div
            key={`delta-${pulse.key}`}
            className="pointer-events-none absolute inset-x-0 text-center"
            style={{ bottom: barPx + (big ? 26 : 20) }}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], y: [4, -6, -12, -22], scale: [0.8, 1, 1, 0.9] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, times: [0, 0.18, 0.7, 1], ease: 'easeOut' }}
          >
            <span
              className={cx('rounded-full px-1.5 py-0.5 font-bold tabular', big ? 'text-sm' : 'text-[10px]')}
              style={{ color: up ? '#047857' : '#475569', background: up ? 'rgba(16,185,129,0.16)' : 'rgba(100,116,139,0.16)' }}
            >
              {up ? '+' : '−'}
              {fmt(Math.abs(pulse.delta))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
