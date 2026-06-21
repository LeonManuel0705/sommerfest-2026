import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MonitorPlay } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { InkBackground } from '@/components/InkBackground'
import { FireBars } from '@/components/FireBars'
import { EmblemLoader, LivePill } from '@/components/ui'
import { useLiveData } from '@/lib/useLiveData'
import { computeJahrgangWertung, fmt } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'

export default function Leaderboard() {
  const { leaderboard, stations, loading, error, live } = useLiveData({ realtime: false, pollMs: 5000 })
  const totalPunkte = leaderboard.reduce((a, r) => a + r.gesamt, 0)
  const aktiveStationen = stations.filter((s) => s.aktiv).length
  const jahrgang = computeJahrgangWertung(leaderboard)

  const stats = [
    { label: 'Klassen', value: String(leaderboard.length) },
    { label: 'Stationen', value: String(aktiveStationen) },
    { label: 'Punkte', value: fmt(totalPunkte) },
  ]

  return (
    <div className="relative min-h-dvh">
      <InkBackground />
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <Brand />
          <div className="flex items-center gap-2">
            <LivePill live={live} />
            <Link
              to="/beamer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-graphite hairline shadow-sm transition hover:bg-paper-2"
            >
              <MonitorPlay className="h-4 w-4 text-moss-600" /> Beamer
            </Link>
          </div>
        </header>

        <div className="mt-8 mb-5">
          <p className="eyebrow text-xs text-moss-600">Sportfest 2026 · Live</p>
          <h1 className="mt-1.5 text-5xl font-bold tracking-tight text-graphite">
            Score<span className="text-gradient">board</span>
          </h1>
        </div>

        <motion.div initial="hidden" animate="show" variants={stagger} className="mb-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="glass rounded-3xl px-4 py-3.5 text-center">
              <div className="text-2xl font-bold tabular text-graphite">{s.value}</div>
              <div className="label-mono mt-0.5 text-[9px] text-graphite-soft">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {loading ? (
          <div className="grid flex-1 place-items-center py-20">
            <EmblemLoader />
          </div>
        ) : error ? (
          <div className="glass rounded-3xl p-6 text-center text-crimson-500">Fehler: {error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-graphite-soft">
            Noch keine Klassen angelegt. Die Orga richtet das im Admin-Bereich ein.
          </div>
        ) : (
          <>
            <FireBars rows={leaderboard} chartH={340} />
            {jahrgang.length >= 2 && (
              <div className="mt-10">
                <div className="mb-1 flex items-baseline justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-graphite">
                    Jahrgangs<span className="text-gradient">wertung</span>
                  </h2>
                  <span className="label-mono text-[10px] text-graphite-soft">Schnitt je Klasse</span>
                </div>
                <div className="glass mt-3 rounded-3xl p-5">
                  <FireBars rows={jahrgang} chartH={240} />
                </div>
              </div>
            )}
          </>
        )}

        <div className="py-8" />
      </div>
    </div>
  )
}
