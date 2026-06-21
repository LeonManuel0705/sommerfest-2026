import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Home, Maximize2, Minimize2 } from 'lucide-react'
import { useLiveData } from '@/lib/useLiveData'
import { FireBars } from '@/components/FireBars'
import { InkBackground } from '@/components/InkBackground'
import { ConfettiBurst } from '@/components/ConfettiBurst'
import { computeJahrgangWertung } from '@/lib/format'

type View = 'klassen' | 'jahrgang'

export default function Beamer() {
  const { leaderboard, live } = useLiveData()
  const [fs, setFs] = useState(false)
  const [flash, setFlash] = useState(0)
  const [lead, setLead] = useState<{ n: number; name: string } | null>(null)
  const [view, setView] = useState<View>('klassen')
  const leaderRef = useRef<string | null>(null)

  const shown = leaderboard.slice(0, 12)
  const jahrgang = useMemo(() => computeJahrgangWertung(leaderboard), [leaderboard])

  useEffect(() => {
    const leader = leaderboard[0]
    if (!leader || leader.gesamt === 0) return
    if (leaderRef.current && leaderRef.current !== leader.team_id) {
      setFlash((f) => f + 1)
      setLead((p) => ({ n: (p?.n ?? 0) + 1, name: leader.name }))
    }
    leaderRef.current = leader.team_id
  }, [leaderboard])

  useEffect(() => {
    if (!lead) return
    const t = window.setTimeout(() => setLead(null), 5000)
    return () => window.clearTimeout(t)
  }, [lead])

  useEffect(() => {
    if (jahrgang.length < 2) {
      setView('klassen')
      return
    }
    const id = window.setInterval(() => setView((v) => (v === 'klassen' ? 'jahrgang' : 'klassen')), 14000)
    return () => window.clearInterval(id)
  }, [jahrgang.length])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().then(() => setFs(true)).catch(() => {})
    else document.exitFullscreen?.().then(() => setFs(false)).catch(() => {})
  }

  const isJg = view === 'jahrgang'
  const rows = isJg ? jahrgang : shown

  return (
    <div className="relative min-h-dvh px-10 py-8">
      <InkBackground />
      <ConfettiBurst fireKey={flash} />

      <AnimatePresence>
        <motion.div
          key={flash}
          initial={{ opacity: 1, scaleX: 0 }}
          animate={{ opacity: 0, scaleX: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="grad-mint pointer-events-none fixed inset-x-0 top-0 h-1 origin-left"
        />
      </AnimatePresence>

      <AnimatePresence>
        {lead && (
          <motion.div
            key={lead.n}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="pointer-events-none fixed left-1/2 top-6 z-[70] -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full bg-white/90 px-6 py-3 shadow-[0_20px_50px_-15px_rgba(5,150,105,0.6)] ring-1 ring-moss-400/40 backdrop-blur">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-brass-300 to-brass-400 text-[#4a3508]">
                <Crown className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold text-graphite">
                Neue Führung: <span className="text-gradient">{lead.name}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="eyebrow text-sm text-moss-600">Ernst-Haeckel-Gymnasium · Sportfest</div>
          <div className="text-5xl font-bold tracking-tight text-graphite">
            Live <span className="text-gradient">Scoreboard</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="mt-1 text-lg font-semibold text-graphite-soft"
            >
              {isJg ? 'Jahrgangswertung · Schnitt je Klasse' : 'Klassenwertung'}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2.5">
          {jahrgang.length >= 2 && (
            <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 hairline shadow-sm">
              <Dot active={!isJg} />
              <Dot active={isJg} />
            </div>
          )}
          <span className="label-mono flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs text-graphite hairline shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-400" />}
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-moss-500" />
            </span>
            Live
          </span>
          <button onClick={toggleFullscreen} className="grid h-10 w-10 place-items-center rounded-full bg-white text-graphite hairline shadow-sm transition hover:bg-paper-2">
            {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-white text-graphite hairline shadow-sm transition hover:bg-paper-2">
            <Home className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl">
        {rows.length > 0 ? (
          <FireBars key={view} rows={rows} big chartH={500} />
        ) : (
          <div className="py-20 text-center text-graphite-soft">Noch keine Wertungen.</div>
        )}
      </div>
    </div>
  )
}

function Dot({ active }: { active: boolean }) {
  return <span className={`h-2 w-2 rounded-full transition-colors ${active ? 'bg-moss-500' : 'bg-graphite/20'}`} />
}
