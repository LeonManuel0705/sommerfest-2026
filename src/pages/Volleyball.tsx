import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { AlertTriangle, Sparkles, Timer, Trophy, Users } from 'lucide-react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { fetchVolleyMatches } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { computeStandings, FINALS, VOLLEY_SCHIENEN, type VolleyMatch } from '@/lib/volley'
import { cx } from '@/lib/format'
import { EmblemLoader } from '@/components/ui'
import { LottieLoop, LottieOnce } from '@/components/Lottie'
import trophyAnim from '@/assets/lottie/trophy.json'
import confettiPop from '@/assets/lottie/confetti-pop.json'

const REGELN = [
  { Icon: Users, title: 'Teamgröße', desc: 'Mind. 6, max. 8 Spieler:innen im Kader.' },
  { Icon: Timer, title: 'Spielzeit', desc: '13 Min. pro Spiel. Bei Gleichstand 2 Punkte Vorsprung.' },
  { Icon: AlertTriangle, title: 'Pünktlichkeit', desc: 'Nicht antretende Teams verlieren mit 0:15.' },
  { Icon: Sparkles, title: 'Mindestquote', desc: 'Immer mind. 2 Mädchen aktiv auf dem Feld.' },
]

export default function Volleyball() {
  const [matches, setMatches] = useState<VolleyMatch[] | null>(null)

  useEffect(() => {
    let alive = true
    const load = () => fetchVolleyMatches().then((m) => alive && setMatches(m)).catch(() => {})
    load()
    const ch = supabase
      .channel('public-volley')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volley_matches' }, load)
      .subscribe()
    const id = window.setInterval(load, 20000)
    return () => {
      alive = false
      supabase.removeChannel(ch)
      window.clearInterval(id)
    }
  }, [])

  const live = (matches ?? []).filter((m) => m.status === 'live')

  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="max-w-2xl">
          <p className="label-mono text-xs text-moss-600">Sportliches Highlight</p>
          <h1 className="mt-2 font-display text-5xl text-graphite sm:text-6xl">Volleyball-Turnier</h1>
          <p className="mt-4 text-lg text-graphite-soft">
            Die Jahrgänge 7–10 treten in der Turnhalle an — Gruppenphase mit Live-Tabellen, dann die Finalspiele.
          </p>
        </div>

        {live.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mt-8 min-h-[200px] overflow-hidden rounded-3xl shadow-card ring-1 ring-moss-700/25"
          >
            <img src="/volley-live.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-right" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#06120c]/55 via-[#06120c]/15 to-transparent" />
            <div className="relative z-10 p-5 text-white sm:p-7">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </span>
                <span className="label-mono text-xs text-white/90">Jetzt im Spiel</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {live.map((m) => (
                  <div key={m.id} className="rounded-2xl bg-black/30 px-5 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                    <div className="text-center label-mono text-[10px] text-white/65">
                      Klasse {m.team_a} vs {m.team_b}
                    </div>
                    <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-x-2.5">
                      <RollingNumber value={m.score_a ?? 0} className="font-display text-4xl font-bold leading-none sm:text-5xl" />
                      <span className="font-display text-2xl leading-none text-white/40 sm:text-3xl">:</span>
                      <RollingNumber value={m.score_b ?? 0} className="font-display text-4xl font-bold leading-none sm:text-5xl" />
                      <span className="mt-1.5 label-mono text-[9px] text-white/55">{m.team_a}</span>
                      <span />
                      <span className="mt-1.5 label-mono text-[9px] text-white/55">{m.team_b}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REGELN.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-moss-600/10 text-moss-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-bold text-graphite">{title}</h3>
              <p className="mt-1 text-sm text-graphite-soft">{desc}</p>
            </div>
          ))}
        </div>

        {matches === null ? (
          <div className="mt-12 grid place-items-center py-16">
            <EmblemLoader />
          </div>
        ) : matches.length === 0 ? (
          <div className="mt-12 rounded-3xl bg-white p-10 text-center text-graphite-soft shadow-card ring-1 ring-black/5">
            Der Spielplan wird von der Orga noch erstellt.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}>
            {VOLLEY_SCHIENEN.map((s) => {
            const finals = matches.filter((m) => m.phase === 'final' && m.schiene === s.schiene)
            return (
              <section key={s.schiene} className="mt-12">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-3xl text-graphite">{s.label}</h2>
                  <span className="text-sm text-graphite-soft">{s.zeit}</span>
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {Object.entries(s.gruppen).map(([g, teams]) => {
                    const gm = matches.filter((m) => m.phase === 'gruppe' && m.schiene === s.schiene && m.gruppe === g)
                    return <GroupCard key={g} gruppe={g} teams={teams} matches={gm} />
                  })}
                </div>
                {finals.length > 0 && <FinalsBlock finals={finals} />}
              </section>
            )
            })}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex items-center gap-4 rounded-3xl bg-white p-6 shadow-card ring-1 ring-black/5"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brass-400/15 text-brass-500">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <div className="font-display text-2xl text-graphite">Highlight: Lehrkräfte vs. Jahrgang 11</div>
            <div className="mt-0.5 text-graphite-soft">12:50 – 13:20 Uhr · Turnhalle — kommt zum Anfeuern vorbei!</div>
          </div>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  )
}

const rollVariants: Variants = {
  enter: (d: number) => ({ y: d >= 0 ? '-110%' : '110%', opacity: 0 }),
  center: { y: '0%', opacity: 1 },
  exit: (d: number) => ({ y: d >= 0 ? '110%' : '-110%', opacity: 0 }),
}

function RollingNumber({ value, className }: { value: number; className?: string }) {
  const prev = useRef(value)
  const dir = value >= prev.current ? 1 : -1
  useEffect(() => {
    prev.current = value
  }, [value])
  return (
    <span className="relative inline-grid overflow-hidden">
      <AnimatePresence initial={false} custom={dir}>
        <motion.span
          key={value}
          custom={dir}
          variants={rollVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className={cx('col-start-1 row-start-1 tabular', className)}
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function GroupCard({ gruppe, teams, matches }: { gruppe: string; teams: string[]; matches: VolleyMatch[] }) {
  const table = computeStandings(teams, matches)
  return (
    <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-card ring-1 ring-black/5">
      <h3 className="font-display text-2xl text-graphite">Gruppe {gruppe}</h3>
      <div className="overflow-x-auto">
        <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-graphite/10 text-left text-[11px] uppercase tracking-wider text-graphite-soft">
            <th className="py-1.5 font-semibold">#</th>
            <th className="py-1.5 font-semibold">Klasse</th>
            <th className="py-1.5 text-center font-semibold">Sp</th>
            <th className="py-1.5 text-center font-semibold">S</th>
            <th className="py-1.5 text-center font-semibold">Diff</th>
            <th className="py-1.5 text-right font-semibold">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {table.map((r, i) => (
            <tr key={r.team} className="border-b border-graphite/[0.06] last:border-0">
              <td className="py-2">
                <span className={cx('grid h-6 w-6 place-items-center rounded-full text-xs font-bold', i === 0 ? 'bg-moss-600 text-white' : 'bg-paper text-graphite-soft')}>{i + 1}</span>
              </td>
              <td className="py-2 font-bold text-graphite whitespace-nowrap">{r.team}</td>
              <td className="py-2 text-center tabular text-graphite-soft">{r.spiele}</td>
              <td className="py-2 text-center tabular text-graphite-soft">{r.siege}</td>
              <td className="py-2 text-center tabular text-graphite-soft">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
              <td className="py-2 text-right font-bold tabular text-graphite">{r.punkte}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-1.5">
        {matches.map((m) => (
          <div key={m.id} className={cx('flex items-center gap-2 rounded-xl px-3 py-2 text-sm', m.status === 'live' ? 'bg-moss-600/10 ring-1 ring-moss-500/30' : 'bg-paper')}>
            <span className="min-w-0 flex-1 truncate text-right font-semibold text-graphite">{m.team_a}</span>
            <span className="w-16 text-center font-bold tabular text-graphite">
              {m.status === 'geplant' ? <span className="text-graphite-soft/50">vs</span> : `${m.score_a ?? 0} : ${m.score_b ?? 0}`}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold text-graphite">{m.team_b}</span>
            {m.status === 'live' && <span className="label-mono text-[9px] text-moss-700">live</span>}
            {m.status === 'fertig' && <span className="label-mono text-[9px] text-graphite-soft/50">fertig</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function FinalsBlock({ finals }: { finals: VolleyMatch[] }) {
  const byPlatz = (p: number) => finals.find((m) => m.platz === p)
  const f1 = byPlatz(1)
  const champ = f1 && f1.status === 'fertig' && f1.score_a != null && f1.score_b != null ? (f1.score_a >= f1.score_b ? f1.team_a : f1.team_b) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brass-300/15 to-white p-5 shadow-card ring-1 ring-brass-400/20 sm:p-6"
    >
      {champ && <LottieOnce data={confettiPop} className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90" />}
      <div className="relative z-10 flex items-center gap-2 font-display text-2xl text-graphite">
        <Trophy className="h-5 w-5 text-brass-500" /> Finalrunde
      </div>
      {champ && (
        <div className="relative z-10 mt-3 inline-flex items-center gap-2 rounded-full bg-brass-400/25 px-4 py-2 text-graphite">
          <LottieLoop data={trophyAnim} className="h-9 w-9" />
          <span className="font-display text-xl">{champ}</span>
          <span className="text-sm text-graphite-soft">— Turniersieger</span>
        </div>
      )}
      <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-3">
        {FINALS.map((f) => {
          const m = byPlatz(f.platz)
          if (!m) return null
          const done = m.status === 'fertig' && m.score_a != null && m.score_b != null
          const aWin = done && (m.score_a ?? 0) >= (m.score_b ?? 0)
          return (
            <div key={f.platz} className={cx('rounded-2xl p-3 ring-1', m.status === 'live' ? 'bg-moss-600/10 ring-moss-500/30' : 'bg-white ring-black/5')}>
              <div className="label-mono text-[10px] text-brass-500">
                {f.titel} · {f.sub}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                <span className={cx('min-w-0 flex-1 truncate font-bold', done && aWin ? 'text-moss-700' : 'text-graphite')}>{m.team_a}</span>
                <span className="shrink-0 font-bold tabular text-graphite">{done ? `${m.score_a}:${m.score_b}` : 'vs'}</span>
                <span className={cx('min-w-0 flex-1 truncate text-right font-bold', done && !aWin ? 'text-moss-700' : 'text-graphite')}>{m.team_b}</span>
              </div>
              {m.status === 'live' && <div className="mt-1 label-mono text-[9px] text-moss-700">live</div>}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
