import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { FireBars } from '@/components/FireBars'
import { LivePill } from '@/components/ui'
import { ScoreboardLocked } from '@/components/ScoreboardLocked'
import { useLiveData } from '@/lib/useLiveData'
import { useScoreboardFrozen } from '@/lib/useSettings'
import { computeJahrgangWertung, fmt } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'

export default function Leaderboard() {
  const { leaderboard, stations, loading, error, live } = useLiveData({ realtime: false, pollMs: 5000 })
  const frozen = useScoreboardFrozen()
  const totalPunkte = leaderboard.reduce((a, r) => a + r.gesamt, 0)
  const aktiveStationen = stations.filter((s) => s.aktiv && s.pflicht).length
  const jahrgang = computeJahrgangWertung(leaderboard)

  const stats = [
    { label: 'Klassen', value: String(leaderboard.length) },
    { label: 'Stationen', value: String(aktiveStationen) },
    { label: 'Punkte', value: fmt(totalPunkte) },
  ]

  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-mono text-xs text-moss-600">Sommerfest 2026 · Live</p>
            <h1 className="mt-1.5 font-display text-4xl text-graphite sm:text-6xl">Scoreboard</h1>
          </div>
          <LivePill live={live} />
        </div>

        <motion.div initial="hidden" animate="show" variants={stagger} className="mt-7 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="rounded-3xl bg-white px-3 py-4 text-center shadow-card ring-1 ring-black/5">
              {loading ? (
                <div className="mx-auto h-8 w-14 animate-pulse rounded-lg bg-graphite/[0.07] sm:h-9" />
              ) : (
                <div className="font-display text-2xl text-graphite tabular tabular-nums tracking-tight sm:text-3xl">{s.value}</div>
              )}
              <div className="label-mono mt-0.5 text-[9px] text-graphite-soft">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {frozen ? (
          <div className="mt-8">
            <ScoreboardLocked />
          </div>
        ) : loading ? (
          <ScoreboardSkeleton />
        ) : error ? (
          <div className="mt-8 rounded-3xl bg-white p-6 text-center text-crimson-500 shadow-card ring-1 ring-black/5">Fehler: {error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-12 text-center text-graphite-soft shadow-card ring-1 ring-black/5">
            Noch keine Klassen angelegt. Die Admins richten das im Admin-Bereich ein.
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-black/5">
              <div className="overflow-x-auto no-scrollbar">
                <FireBars rows={leaderboard} chartH={340} />
              </div>
            </div>
            {jahrgang.length >= 2 && (
              <div className="mt-8">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-display text-3xl text-graphite">Jahrgangs-Duell</h2>
                  <span className="label-mono text-[10px] text-graphite-soft">Schnitt je Klasse</span>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-black/5">
                  <div className="overflow-x-auto no-scrollbar">
                    <FireBars rows={jahrgang} chartH={240} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

const SKELETON_HEIGHTS = [58, 34, 72, 24, 46, 88, 38, 64, 28, 52, 78, 42, 60, 32, 48, 68, 22, 56, 40, 74, 30, 50]

function ScoreboardSkeleton() {
  return (
    <div className="mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-black/5">
      <div className="flex h-[340px] items-end gap-1.5 sm:gap-2">
        {SKELETON_HEIGHTS.map((h, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full animate-pulse rounded-t-[8px] bg-graphite/[0.07]"
              style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
            />
            <div className="h-2.5 w-5 animate-pulse rounded-full bg-graphite/[0.06]" style={{ animationDelay: `${i * 70}ms` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
