import { AnimatePresence, motion } from 'framer-motion'
import type { LeaderboardRow } from '@/lib/types'
import { rankMap, rankSweepColor } from '@/lib/format'
import { spring } from '@/lib/motion'
import { AnimatedNumber } from './AnimatedNumber'

export function LeaderboardList({ rows }: { rows: LeaderboardRow[] }) {
  const ranks = rankMap(rows)
  const total = rows.length

  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence initial={false}>
        {rows.map((row, i) => {
          const rank = ranks.get(row.team_id) ?? i + 1
          const sweep = rankSweepColor(i, total)
          const leader = rank === 1
          return (
            <motion.div
              key={row.team_id}
              layout
              layoutId={row.team_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={spring}
              className="clip-notch glass-ink relative flex items-center gap-3 overflow-hidden py-2.5 pr-4 pl-0"
              style={leader ? { boxShadow: '0 0 34px -8px rgba(139,92,246,0.6)', borderColor: 'rgba(139,92,246,0.45)' } : undefined}
            >
              <span className="self-stretch" style={{ width: 5, background: sweep, boxShadow: `0 0 16px ${sweep}` }} />
              <span className="w-9 text-center font-display text-2xl font-extrabold tabular" style={{ color: sweep }}>
                {String(rank).padStart(2, '0')}
              </span>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.farbe }} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg font-bold uppercase tracking-wide text-white">{row.name}</div>
                <div className="label-mono text-[9px] text-white/35">
                  {row.stationen_gewertet} {row.stationen_gewertet === 1 ? 'Station' : 'Stationen'}
                </div>
              </div>
              <div className="font-display text-3xl font-extrabold tabular text-white">
                <AnimatedNumber value={row.gesamt} />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
