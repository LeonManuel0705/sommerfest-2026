import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLottie } from 'lottie-react'
import rewardAnim from '@/assets/lottie/reward-light.json'
import { ArrowRight, Cake, CalendarDays, ChevronRight, Clock, CupSoda, Flag, Flame, History, Info, Lock, MapPin, MessagesSquare, MonitorPlay, Sprout, TrendingUp, Trophy, Volleyball } from 'lucide-react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { useLiveData } from '@/lib/useLiveData'
import { useScoreboardFrozen } from '@/lib/useSettings'
import { ScoreboardLocked } from '@/components/ScoreboardLocked'
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
  const frozen = useScoreboardFrozen()
  const podium = leaderboard.slice(0, 3)
  const jahrgang = computeJahrgangWertung(leaderboard)
  const [showAllStations, setShowAllStations] = useState(false)
  const [showAllZeit, setShowAllZeit] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('stationen') !== 'open') return
    setShowAllStations(true)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('stationen')
        return next
      },
      { replace: true },
    )
    window.setTimeout(() => document.getElementById('stationen')?.scrollIntoView({ behavior: 'smooth' }), 120)
  }, [searchParams, setSearchParams])

  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />

      <section className="relative select-none overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/hero-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/55 to-paper" />
        <RewardLight />
        <div className="relative mx-auto max-w-4xl px-5 py-16 text-center sm:py-32">
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
            <span className="block text-5xl text-graphite sm:text-8xl lg:text-[8.5rem]">Sommerfest</span>
            <span className="block text-5xl text-moss-600 sm:text-8xl lg:text-[8.5rem]">2026</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-7 text-xl font-semibold text-graphite">
            Ernst-Haeckel-Gymnasium Werder (Havel)
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }} className="mt-1 text-graphite-soft">
            Organisiert vom Jahrgang 11
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="mt-6 flex justify-center">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-graphite/[0.05] px-4 py-2 text-center text-sm font-semibold text-graphite ring-1 ring-black/[0.06]">
              <History className="h-4 w-4 shrink-0 text-moss-600" /> <span className="min-w-0 break-words">Motto: Zeitreise — von der Steinzeit bis Cyberpunk</span>
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

      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <motion.div {...inView} className="text-center">
          <div className="flex justify-center">
            <Kicker Icon={Trophy}>Live-Wertung</Kicker>
          </div>
          <h2 className="mt-3 font-display text-4xl text-graphite sm:text-5xl">Aktuelle Spitzenreiter</h2>
          <p className="mt-3 text-graphite-soft">Klassenübergreifende Gesamtwertung, live aktualisiert.</p>
        </motion.div>
        {frozen ? (
          <div className="mt-12">
            <ScoreboardLocked />
          </div>
        ) : podium.length > 0 ? (
          <PodiumStage podium={podium} />
        ) : (
          <motion.div {...inView} className="relative mx-auto mt-12 aspect-[147/107] w-full overflow-hidden rounded-[2rem] shadow-card ring-1 ring-black/5">
            <img src="/podium.jpg" alt="Siegerpodest" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/70 via-graphite/20 to-transparent p-6 pt-16 text-center">
              <p className="text-sm font-semibold text-white/95 sm:text-base">
                Sobald die ersten Punkte eingetragen werden, stehen hier die Führenden auf dem Podest.
              </p>
            </div>
          </motion.div>
        )}
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-5 pb-8 sm:px-8 lg:grid-cols-2">
        <motion.div {...inView} className="rounded-3xl bg-white p-7 shadow-card ring-1 ring-black/5">
          <Eyebrow Icon={Trophy} tint="crimson">Gesamtwertung</Eyebrow>
          <h3 className="mt-3 font-display text-3xl text-graphite">Jahrgangs-Duell</h3>
          {frozen ? (
            <p className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-graphite/[0.04] px-4 py-8 text-center text-sm font-semibold text-graphite-soft">
              <Lock className="h-4 w-4 text-moss-600" /> Wird bei der Siegerehrung enthüllt.
            </p>
          ) : (
            <>
              <JahrgangBars rows={jahrgang} />
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-moss-600/[0.07] px-4 py-2.5 text-sm font-medium text-moss-700 ring-1 ring-moss-600/10">
                <TrendingUp className="h-4 w-4 shrink-0" /> Die Platzierungen werden laufend aktualisiert.
              </div>
            </>
          )}
        </motion.div>

        <motion.div {...inView} className="flex flex-col rounded-3xl bg-white p-7 shadow-card ring-1 ring-black/5">
          <Eyebrow Icon={Clock} tint="moss">Ablauf</Eyebrow>
          <h3 className="mt-3 font-display text-3xl text-graphite">Zeitplan</h3>
          <ol className="mt-6 space-y-5">
            {ZEITPLAN.slice(0, 4).map((z, i) => (
              <ZeitItem key={z.time} z={z} connector={i < 3 || showAllZeit} />
            ))}
          </ol>
          <AnimatePresence initial={false}>
            {showAllZeit && (
              <motion.ol
                key="zeit-more"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                className="space-y-5 overflow-hidden pt-5"
              >
                {ZEITPLAN.slice(4).map((z, i, arr) => (
                  <ZeitItem key={z.time} z={z} connector={i < arr.length - 1} />
                ))}
              </motion.ol>
            )}
          </AnimatePresence>
          <p className="mt-5 text-sm font-medium text-graphite-soft">Viel Erfolg und Spaß beim Sammeln von Punkten!</p>
          <button
            onClick={() => setShowAllZeit((v) => !v)}
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-2xl bg-moss-600/10 px-4 py-2.5 text-sm font-semibold text-moss-700 transition hover:bg-moss-600/15"
          >
            <CalendarDays className="h-4 w-4" /> {showAllZeit ? 'Weniger anzeigen' : 'Kompletten Ablauf ansehen'}
            <ChevronRight className={cx('h-4 w-4 transition-transform', showAllZeit && 'rotate-90')} />
          </button>
        </motion.div>
      </section>

      <section id="stationen" className="mt-12 border-y border-graphite/[0.06] bg-white py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div {...inView} className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <Kicker Icon={Flag}>Wettkampf</Kicker>
              <h2 className="mt-4 font-display text-4xl text-graphite sm:text-5xl">11 Stationen — eine Siegerklasse</h2>
              <p className="mt-4 text-lg leading-relaxed text-graphite-soft">
                Von Allgemeinwissen-Quiz über Pantomime bis Sackhüpfen: Ihr tretet als Klasse an 11 Stationen an und sammelt Punkte. Dazu das große
                Volleyball-Turnier der Jahrgänge 7–10. Am Ende steht fest, wer die beste Klasse der ganzen Schule ist.
              </p>
            </div>
            <motion.img
              src="/illus/trophy.png?v=2"
              alt=""
              aria-hidden
              className="hidden w-40 shrink-0 self-center sm:block lg:w-48"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
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
          <motion.div {...inView} className="mt-8 grid gap-4 sm:grid-cols-2">
            <NavCard to="/lageplan" Icon={MapPin} title="Wo finde ich was?" sub="Lageplan, Stationen & wichtige Orte" />
            <NavCard to="/volleyball" Icon={Volleyball} title="Volleyball-Turnierplan" sub="Spielplan, Teams & Zahlen" />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <motion.div {...inView} className="flex items-start justify-between gap-6">
          <div>
            <Kicker Icon={Sprout}>Verpflegung</Kicker>
            <h2 className="mt-4 font-display text-4xl text-graphite sm:text-5xl">
              Für Stärkung ist{' '}
              <span className="relative inline-block whitespace-nowrap">
                gesorgt
                <Underline className="absolute -bottom-1.5 left-0 h-3 w-full text-moss-500" />
              </span>
            </h2>
          </div>
          <motion.img
            src="/illus/food.png?v=2"
            alt=""
            aria-hidden
            className="hidden w-28 shrink-0 self-center sm:block lg:w-32"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {VERPFLEGUNG.map(({ Icon, title, desc }) => (
            <motion.div
              {...inView}
              key={title}
              className="rounded-3xl bg-white p-7 shadow-card ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-moss-500/25"
            >
              <span className="text-moss-600">
                <Icon className="h-8 w-8" strokeWidth={1.6} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-graphite">{title}</h3>
              <p className="mt-1 text-sm text-graphite-soft">{desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div {...inView} className="mt-5 flex items-start gap-4 rounded-3xl bg-brass-400/10 p-6 ring-1 ring-brass-400/25">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brass-400/20 text-brass-500">
            <Info className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold text-graphite">Gut zu wissen</h3>
            <p className="mt-1 text-sm leading-relaxed text-graphite-soft">
              Die Stände vom Jahrgang 11 sind kostenpflichtig — der Erlös finanziert den Abiball, die Cafeteria bleibt geschlossen. Bringt etwas Taschengeld mit
              und denkt bei Sommerwetter an Sonnenschutz und genug zu trinken.
            </p>
          </div>
        </motion.div>
        <motion.div {...inView} className="mt-12 flex justify-center">
          <Link
            to="/rangliste"
            className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-7 py-4 text-[15px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] transition hover:bg-moss-700"
          >
            Zum Live-Scoreboard <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <section className="border-t border-graphite/[0.06] bg-white py-16">
        <motion.div {...inView} className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 text-center sm:px-8">
          <div>
            <div className="flex justify-center">
              <Kicker Icon={MessagesSquare}>Eure Meinung</Kicker>
            </div>
            <h2 className="mt-3 font-display text-4xl text-graphite sm:text-5xl">Sag uns, wie&apos;s war</h2>
            <p className="mx-auto mt-3 max-w-xl text-graphite-soft">
              Ein paar kurze Fragen, komplett anonym — dein Feedback landet direkt bei der Orga vom Jahrgang 11.
            </p>
          </div>
          <Link
            to="/feedback"
            className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-7 py-4 text-[15px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] transition hover:bg-moss-700"
          >
            Feedback geben <ArrowRight className="h-4 w-4" />
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

function Kicker({ Icon, children }: { Icon: typeof Trophy; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-moss-600">
      <Icon className="h-4 w-4" strokeWidth={2.2} />
      <span className="text-[12px] font-bold uppercase tracking-[0.2em]">{children}</span>
    </div>
  )
}

function Underline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 14" fill="none" preserveAspectRatio="none" aria-hidden>
      <motion.path
        d="M4 9C46 3 150 2 196 7"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
      />
    </svg>
  )
}

function NavCard({ to, Icon, title, sub }: { to: string; Icon: typeof Trophy; title: string; sub: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-moss-500/25"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-moss-600/10 text-moss-700">
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-graphite">{title}</div>
        <div className="truncate text-sm text-graphite-soft">{sub}</div>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-graphite-soft/50 transition group-hover:translate-x-1 group-hover:text-moss-600" />
    </Link>
  )
}

function PodiumStage({ podium }: { podium: LeaderboardRow[] }) {
  const plates = [
    { row: podium[1], place: 2 as const, xName: 25, yName: 46, xPts: 25, yPts: 70 },
    { row: podium[0], place: 1 as const, xName: 51, yName: 41, xPts: 51, yPts: 68 },
    { row: podium[2], place: 3 as const, xName: 76, yName: 50.5, xPts: 76, yPts: 72.5 },
  ]
  return (
    <motion.div {...inView} className="relative mx-auto mt-12 aspect-[147/107] w-full overflow-hidden rounded-[2rem] shadow-card ring-1 ring-black/5">
      <img src="/podium.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(58% 42% at 50% 4%, rgba(98,201,138,0.22), transparent 60%)' }} />
      {plates.map((p) => (p.row ? <PodiumPlate key={p.row.team_id} row={p.row} place={p.place} xName={p.xName} yName={p.yName} xPts={p.xPts} yPts={p.yPts} /> : null))}
    </motion.div>
  )
}

function PodiumPlate({
  row,
  place,
  xName,
  yName,
  xPts,
  yPts,
}: {
  row: LeaderboardRow
  place: 1 | 2 | 3
  xName: number
  yName: number
  xPts: number
  yPts: number
}) {
  const top = place === 1
  const delay = place === 1 ? 0.12 : place === 2 ? 0.24 : 0.36
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, delay }}
        className={cx(
          'absolute -translate-x-1/2 -translate-y-1/2 font-display font-bold leading-none text-graphite [text-shadow:0_1px_10px_rgba(255,255,255,0.95),0_0_5px_rgba(255,255,255,0.9)]',
          top ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl',
        )}
        style={{ left: `${xName}%`, top: `${yName}%` }}
      >
        {row.name}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ type: 'spring', stiffness: 150, damping: 16, delay: delay + 0.06 }}
        className={cx(
          'absolute -translate-x-1/2 -translate-y-1/2 font-display leading-none text-moss-600 tabular [text-shadow:0_1px_8px_rgba(255,255,255,0.9)]',
          top ? 'text-xl sm:text-3xl' : 'text-lg sm:text-2xl',
        )}
        style={{ left: `${xPts}%`, top: `${yPts}%` }}
      >
        {fmt(row.gesamt)}
      </motion.div>
    </>
  )
}

function ZeitItem({ z, connector }: { z: { time: string; title: string; desc: string }; connector: boolean }) {
  return (
    <li className="relative flex gap-4 pl-1">
      <div className="relative flex flex-col items-center">
        <span className="mt-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-moss-600 ring-4 ring-moss-600/15" />
        {connector && <span className="mt-1 w-px flex-1 bg-graphite/10" />}
      </div>
      <div className="-mt-0.5 pb-1">
        <div className="flex items-baseline gap-2">
          <span className="font-bold tabular text-graphite">{z.time}</span>
          <span className="font-semibold text-graphite">{z.title}</span>
        </div>
        <p className="mt-0.5 text-sm text-graphite-soft">{z.desc}</p>
      </div>
    </li>
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
