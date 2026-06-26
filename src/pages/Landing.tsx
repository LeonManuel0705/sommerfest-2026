import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLottie } from 'lottie-react'
import rewardAnim from '@/assets/lottie/reward-light.json'
import { ArrowRight, Cake, Clock, CupSoda, Flame, History, Info, MapPin, MonitorPlay, Trophy, Volleyball } from 'lucide-react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { useLiveData } from '@/lib/useLiveData'
import { computeJahrgangWertung, cx, fmt } from '@/lib/format'
import type { LeaderboardRow } from '@/lib/types'

const ZEITPLAN = [
  { time: '08:00', title: 'Treffen im Klassenraum', desc: 'Anwesenheit & Orga mit den Klassenlehrkräften.' },
  { time: '08:15', title: 'Begrüßung in der Aula', desc: 'Offizieller Start für alle gemeinsam.' },
  { time: '08:40', title: 'Stationen 1–5', desc: 'Je 15 Min. Action, dann 5 Min. Wechselzeit.' },
  { time: '10:20', title: 'Große Frühstückspause', desc: 'Foodcourt im Foyer (30 Min.).' },
  { time: '10:50', title: 'Stationen 6–10', desc: 'Weiter durch die Disziplinen.' },
  { time: '12:30', title: 'Mittagspause & Grillen', desc: 'Auf dem Schulhof — dazu das Highlight: Lehrkräfte vs. Jahrgang 11.' },
  { time: '13:20', title: 'Letzte Station', desc: 'Station 11 für alle Klassen.' },
  { time: '13:40', title: 'Tanzshow', desc: 'Auftritt des WP-Kurses Tanz in der Aula.' },
  { time: '14:00', title: 'Siegerehrung', desc: 'Großer Abschluss in der Aula — wer ist die beste Klasse?' },
]
const STATIONEN = [
  'Allgemeinwissen-Quiz',
  'Lehrkräfte-Quiz',
  'Hobbyhorsing',
  'Wasserpong',
  'Just Dance',
  'Bobbycar-Racing',
  'Stadt, Land, Fluss',
  'Pantomime',
  'Sackhüpfen',
  'Laufen',
  'Fotos',
]
const STATIONEN_VISIBLE = 6
const VERPFLEGUNG = [
  { Icon: Flame, title: 'Großes Grillen', desc: 'In der Mittagspause auf dem Schulhof' },
  { Icon: Cake, title: 'Foodcourt im Foyer', desc: 'Herzhaftes & Süßes vom Jahrgang 11' },
  { Icon: CupSoda, title: 'Erfrischungen', desc: 'Kalte Getränke gegen die Sommerhitze' },
]

const inView = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-70px' },
  transition: { type: 'spring' as const, stiffness: 90, damping: 18 },
}

export default function Landing() {
  const { leaderboard } = useLiveData({ realtime: false, pollMs: 8000 })
  const podium = leaderboard.slice(0, 3)
  const jahrgang = computeJahrgangWertung(leaderboard)
  const [showAllStations, setShowAllStations] = useState(false)

  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />

      <section className="relative select-none overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/hero-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/55 to-paper" />
        <RewardLight />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:py-32">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-crimson-500 shadow-sm ring-1 ring-black/5">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson-500" /> 7. Juli 2026
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 16, delay: 0.08 }}
            className="mt-7 font-display leading-[0.86]"
          >
            <span className="block text-7xl text-graphite sm:text-8xl lg:text-[8.5rem]">Sommerfest</span>
            <span className="block text-7xl text-moss-600 sm:text-8xl lg:text-[8.5rem]">2026</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-7 text-xl font-semibold text-graphite">
            Ernst-Haeckel-Gymnasium Werder (Havel)
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }} className="mt-1 text-graphite-soft">
            Organisiert vom Jahrgang 11
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-graphite/[0.05] px-4 py-2 text-sm font-semibold text-graphite ring-1 ring-black/[0.06]">
              <History className="h-4 w-4 text-moss-600" /> Motto: Zeitreise — von der Steinzeit bis Cyberpunk
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/rangliste"
              className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] transition hover:bg-moss-700"
            >
              <Trophy className="h-[18px] w-[18px]" /> Zum Live-Scoreboard
            </Link>
            <Link
              to="/beamer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-graphite shadow-sm ring-1 ring-black/[0.08] transition hover:bg-paper-2"
            >
              <MonitorPlay className="h-[18px] w-[18px] text-moss-600" /> Beamer-Ansicht
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <motion.div {...inView} className="text-center">
          <h2 className="font-display text-4xl text-graphite sm:text-5xl">Aktuelle Spitzenreiter</h2>
          <p className="mt-3 text-graphite-soft">Live-Stand der klassenübergreifenden Wertung</p>
        </motion.div>
        {podium.length > 0 ? (
          <div className="mt-14 grid items-end gap-5 sm:grid-cols-3">
            {[podium[1], podium[0], podium[2]].map((row, i) =>
              row ? <PodiumCard key={row.team_id} row={row} rank={i === 1 ? 1 : i === 0 ? 2 : 3} leader={i === 1} /> : <div key={i} className="hidden sm:block" />,
            )}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl bg-white p-12 text-center text-graphite-soft shadow-card ring-1 ring-black/5">
            Sobald Punkte eingetragen werden, erscheinen hier die Führenden.
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-5 pb-8 sm:px-8 lg:grid-cols-2">
        <motion.div {...inView} className="rounded-3xl bg-white p-7 shadow-card ring-1 ring-black/5">
          <Eyebrow Icon={Trophy} tint="crimson">Gesamtwertung</Eyebrow>
          <h3 className="mt-3 font-display text-3xl text-graphite">Jahrgangs-Duell</h3>
          <JahrgangBars rows={jahrgang} />
        </motion.div>

        <motion.div {...inView} className="rounded-3xl bg-white p-7 shadow-card ring-1 ring-black/5">
          <Eyebrow Icon={Clock} tint="moss">Ablauf</Eyebrow>
          <h3 className="mt-3 font-display text-3xl text-graphite">Zeitplan</h3>
          <ol className="mt-6 space-y-5">
            {ZEITPLAN.map((z, i) => (
              <li key={z.time} className="relative flex gap-4 pl-1">
                <div className="relative flex flex-col items-center">
                  <span className="mt-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-moss-600 ring-4 ring-moss-600/15" />
                  {i < ZEITPLAN.length - 1 && <span className="mt-1 w-px flex-1 bg-graphite/10" />}
                </div>
                <div className="-mt-0.5 pb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold tabular text-graphite">{z.time}</span>
                    <span className="font-semibold text-graphite">{z.title}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-graphite-soft">{z.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      </section>

      <section id="stationen" className="mt-12 border-y border-graphite/[0.06] bg-white py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div {...inView}>
            <p className="label-mono text-xs text-moss-600">Wettkampf</p>
            <h2 className="mt-2 font-display text-4xl text-graphite sm:text-5xl">11 Stationen — eine Siegerklasse</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-graphite-soft">
              Von Allgemeinwissen-Quiz über Pantomime bis Sackhüpfen: Ihr tretet als Klasse an 11 Stationen an und sammelt Punkte. Dazu das große
              Volleyball-Turnier der Jahrgänge 7–10. Am Ende steht fest, wer die beste Klasse der ganzen Schule ist.
            </p>
          </motion.div>
          <motion.div {...inView} className="mt-8 flex flex-wrap items-center gap-3">
            {STATIONEN.slice(0, STATIONEN_VISIBLE).map((s) => (
              <span key={s} className="rounded-full bg-paper px-4 py-2 text-sm font-medium text-graphite ring-1 ring-black/[0.06]">
                {s}
              </span>
            ))}
            <AnimatePresence>
              {showAllStations &&
                STATIONEN.slice(STATIONEN_VISIBLE).map((s) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-full bg-paper px-4 py-2 text-sm font-medium text-graphite ring-1 ring-black/[0.06]"
                  >
                    {s}
                  </motion.span>
                ))}
            </AnimatePresence>
            <button
              onClick={() => setShowAllStations((v) => !v)}
              className="rounded-full bg-moss-600/10 px-4 py-2 text-sm font-semibold text-moss-700 transition hover:bg-moss-600/15"
            >
              {showAllStations ? 'Weniger anzeigen' : `+ ${STATIONEN.length - STATIONEN_VISIBLE} weitere`}
            </button>
          </motion.div>
          <motion.div {...inView} className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/lageplan"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-graphite ring-1 ring-black/[0.08] transition hover:bg-paper-2"
            >
              <MapPin className="h-4 w-4 text-moss-600" /> Wo finde ich was?
            </Link>
            <Link
              to="/volleyball"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-graphite ring-1 ring-black/[0.08] transition hover:bg-paper-2"
            >
              <Volleyball className="h-4 w-4 text-moss-600" /> Volleyball-Turnierplan
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <motion.div {...inView}>
          <p className="label-mono text-xs text-moss-600">Verpflegung</p>
          <h2 className="mt-2 font-display text-4xl text-graphite sm:text-5xl">Für Stärkung ist gesorgt</h2>
        </motion.div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {VERPFLEGUNG.map(({ Icon, title, desc }) => (
            <motion.div {...inView} key={title} className="rounded-3xl bg-white p-7 shadow-card ring-1 ring-black/5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-moss-600/10 text-moss-700">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-graphite">{title}</h3>
              <p className="mt-1 text-sm text-graphite-soft">{desc}</p>
            </motion.div>
          ))}
          <motion.div {...inView} className="rounded-3xl border border-dashed border-graphite/15 p-7 sm:col-span-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brass-400/15 text-brass-500">
              <Info className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-graphite">Gut zu wissen</h3>
            <p className="mt-1 text-sm text-graphite-soft">
              Die Stände vom Jahrgang 11 sind kostenpflichtig — der Erlös finanziert den Abiball, die Cafeteria bleibt geschlossen. Bringt etwas Taschengeld mit
              und denkt bei Sommerwetter an Sonnenschutz und genug zu trinken.
            </p>
          </motion.div>
        </div>
        <motion.div {...inView} className="mt-12 flex justify-center">
          <Link
            to="/rangliste"
            className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-7 py-4 text-[15px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] transition hover:bg-moss-700"
          >
            Zum Live-Scoreboard <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <section className="border-t border-graphite/[0.06] py-10">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Link
            to="/zeitreise"
            className="group inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-graphite-soft transition hover:text-graphite"
          >
            <History className="h-4 w-4 text-moss-600/70" />
            Ach übrigens — jede Klasse reist als eigene Epoche.
            <span className="font-semibold text-moss-700 group-hover:underline">Zur Zeitreise →</span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

function RewardLight() {
  const { View } = useLottie({ animationData: rewardAnim, autoplay: true, loop: true }, { width: '100%', height: '100%' })
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2"
      style={{ width: 'min(112vw, 720px)', height: 'min(112vw, 720px)' }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle, rgba(250,182,46,0.32) 0%, rgba(245,158,11,0.12) 30%, transparent 55%)' }}
        animate={{ opacity: [0.8, 1, 0.8], scale: [0.97, 1.02, 0.97] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 opacity-[0.22]" style={{ filter: 'sepia(1) saturate(4) hue-rotate(-13deg) brightness(1)' }}>
        {View}
      </div>
    </div>
  )
}

function Eyebrow({ Icon, tint, children }: { Icon: typeof Trophy; tint: 'moss' | 'crimson'; children: React.ReactNode }) {
  const c = tint === 'moss' ? 'bg-moss-600/10 text-moss-700' : 'bg-crimson-500/10 text-crimson-500'
  return (
    <div className="flex items-center gap-2">
      <span className={cx('grid h-7 w-7 place-items-center rounded-lg', c)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="label-mono text-[11px] text-graphite-soft">{children}</span>
    </div>
  )
}

function PodiumCard({ row, rank, leader }: { row: LeaderboardRow; rank: number; leader: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 90, damping: 17, delay: leader ? 0 : 0.08 }}
      className={cx(
        'relative rounded-3xl bg-white px-6 pb-6 pt-10 text-center shadow-card ring-1 ring-black/5',
        leader && 'sm:-mt-6 sm:pb-8 sm:pt-12 ring-moss-500/25 shadow-[0_24px_50px_-22px_rgba(0,128,55,0.4)]',
      )}
    >
      <span
        className={cx(
          'absolute -top-5 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full text-sm font-bold',
          leader ? 'bg-moss-600 text-white shadow-[0_10px_24px_-8px_rgba(0,128,55,0.8)]' : 'bg-white text-graphite shadow ring-1 ring-black/10',
        )}
      >
        {leader ? <Trophy className="h-5 w-5" /> : rank}
      </span>
      <div className="font-display text-5xl text-graphite tabular">{fmt(row.gesamt)}</div>
      <div className="label-mono mt-0.5 text-[10px] text-graphite-soft">Punkte</div>
      <div className="mx-auto mt-3 h-1 w-10 rounded-full" style={{ background: leader ? '#008037' : '#e31e24' }} />
      <div className="mt-3 font-bold text-graphite">Klasse {row.name}</div>
      {row.jahrgang != null && <div className="text-xs text-graphite-soft">Klasse {row.jahrgang}</div>}
    </motion.div>
  )
}

function JahrgangBars({ rows }: { rows: LeaderboardRow[] }) {
  const ordered = [...rows].sort((a, b) => (a.jahrgang ?? 0) - (b.jahrgang ?? 0))
  const max = Math.max(1, ...ordered.map((r) => r.gesamt))
  if (ordered.length === 0) return <p className="mt-8 text-sm text-graphite-soft">Noch keine Wertungen.</p>
  const TRACK = 150
  return (
    <div className="mt-8 flex items-end justify-between gap-3">
      {ordered.map((r, i) => {
        const barPx = Math.max(8, Math.round((r.gesamt / max) * TRACK))
        const top = i === 0
        return (
          <div key={r.team_id} className="flex flex-1 flex-col items-center gap-2" style={{ height: TRACK + 48 }}>
            <div className="flex w-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-bold tabular text-graphite">{fmt(r.gesamt)}</span>
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.05 }}
                className="w-full rounded-t-[10px]"
                style={{ height: barPx, transformOrigin: 'bottom', background: top ? 'linear-gradient(0deg,#00662c,#23a85a)' : 'linear-gradient(0deg,#cfe9d8,#9ed3b3)' }}
              />
            </div>
            <span className="text-[11px] font-medium text-graphite-soft">Jg. {r.jahrgang}</span>
          </div>
        )
      })}
    </div>
  )
}
