import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLottie } from 'lottie-react'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Compass,
  Flag,
  Frown,
  GitBranch,
  GraduationCap,
  Lock,
  Mic,
  MonitorSmartphone,
  PartyPopper,
  PenLine,
  Repeat,
  School,
  Send,
  Sparkles,
  ThumbsDown,
  Timer,
  Trophy,
  Users,
  Utensils,
  Volleyball,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import checkAnim from '@/assets/lottie/check-green.json'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { ConfettiBurst } from '@/components/ConfettiBurst'
import { InkBackground } from '@/components/InkBackground'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { fetchFeedbackCount, fetchStationsPublic, fetchTeams, submitFeedback } from '@/lib/api'
import type {
  FeedbackEssen,
  FeedbackLaenge,
  FeedbackLehrerRolle,
  FeedbackOrga,
  FeedbackRolle,
  FeedbackVolley,
  FeedbackWebsite,
  FeedbackWieder,
} from '@/lib/types'
import { cx } from '@/lib/format'

const RATING_WORDS = ['Schwach', 'Ging so', 'Okay', 'Stark', 'Legendär']
const BAR_HEIGHTS = [34, 50, 66, 82, 98]
const HIGHLIGHTS = [
  'Stationen',
  'Volleyball-Turnier',
  'Lehrkräfte vs. Jahrgang 11',
  'Grillen & Foodcourt',
  'Tanzshow',
  'Zeitreise-Motto',
  'Siegerehrung',
  'Stimmung',
  'Live-Scoreboard',
]
const KRITIK = [
  'Lange Wartezeiten',
  'Ablauf & Orga',
  'Stationen-Auswahl',
  'Essen & Preise',
  'Hitze / zu wenig Schatten',
  'Zu wenig Sitzplätze',
  'Lautstärke',
  'Sonstiges',
]
const ESSEN_DETAIL = [
  'Zu teuer',
  'Auswahl zu klein',
  'Geschmack',
  'Lange Schlangen',
  'Zu früh ausverkauft',
  'Nichts Vegetarisches',
  'Sonstiges',
]
const ORGA_DETAIL = [
  'Unklare Ansagen',
  'Wechselzeiten zu knapp',
  'Zeitplan nicht eingehalten',
  'Lange Wartezeiten',
  'Zu wenig Helfer',
  'Stationen schwer zu finden',
  'Sonstiges',
]
const WEBSITE_DETAIL = [
  'Unübersichtlich',
  'Lud langsam',
  'Punkte nicht aktuell',
  'Am Handy unpraktisch',
  'Infos gefehlt',
  'Wusste lange nichts von ihr',
  'Sonstiges',
]
const KLASSEN_FALLBACK = [
  '5s', '6s',
  '7a', '7b', '7c', '7d', '7s',
  '8a', '8b', '8c', '8s',
  '9a', '9b', '9c', '9d', '9s',
  '10a', '10b', '10c', '10d', '10s',
]
const STATIONEN_FALLBACK = [
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
  'Volleyball-Turnier',
]

type Accent = 'moss' | 'crimson' | 'brass' | 'electric'
const ACCENT: Record<Accent, { tile: string; sel: string; hover: string }> = {
  moss: {
    tile: 'bg-moss-600/10 text-moss-700',
    sel: 'bg-moss-600 text-white ring-moss-600 shadow-[0_14px_30px_-14px_rgba(0,128,55,0.8)]',
    hover: 'hover:ring-moss-500/35',
  },
  crimson: {
    tile: 'bg-crimson-500/10 text-crimson-500',
    sel: 'bg-crimson-500 text-white ring-crimson-500 shadow-[0_14px_30px_-14px_rgba(227,30,36,0.7)]',
    hover: 'hover:ring-crimson-500/35',
  },
  brass: {
    tile: 'bg-brass-400/15 text-brass-500',
    sel: 'bg-gradient-to-b from-brass-300 to-brass-400 text-[#4a3508] ring-brass-400 shadow-[0_14px_30px_-14px_rgba(185,133,42,0.8)]',
    hover: 'hover:ring-brass-400/45',
  },
  electric: {
    tile: 'bg-electric-500/15 text-[#0f766e]',
    sel: 'bg-electric-500 text-[#04352d] ring-electric-500 shadow-[0_14px_30px_-14px_rgba(45,212,191,0.8)]',
    hover: 'hover:ring-electric-500/45',
  },
}

type StepId =
  | 'rolle'
  | 'klasse'
  | 'lehrerrolle'
  | 'rating'
  | 'kritik'
  | 'highlights'
  | 'station'
  | 'essen'
  | 'essen_detail'
  | 'volleyball'
  | 'orga'
  | 'orga_detail'
  | 'laenge'
  | 'website'
  | 'website_detail'
  | 'wieder'
  | 'kommentar'

const STEP_META: Record<StepId, { cat: string; Icon: LucideIcon; accent: Accent }> = {
  rolle: { cat: 'Über dich', Icon: Users, accent: 'moss' },
  klasse: { cat: 'Über dich', Icon: GraduationCap, accent: 'moss' },
  lehrerrolle: { cat: 'Über dich', Icon: School, accent: 'moss' },
  rating: { cat: 'Dein Urteil', Icon: Trophy, accent: 'brass' },
  kritik: { cat: 'Dein Urteil', Icon: Frown, accent: 'crimson' },
  highlights: { cat: 'Die Höhepunkte', Icon: Sparkles, accent: 'moss' },
  station: { cat: 'Die Stationen', Icon: Flag, accent: 'electric' },
  essen: { cat: 'Verpflegung', Icon: Utensils, accent: 'brass' },
  essen_detail: { cat: 'Verpflegung', Icon: Utensils, accent: 'brass' },
  volleyball: { cat: 'Volleyball', Icon: Volleyball, accent: 'crimson' },
  orga: { cat: 'Orga & Ablauf', Icon: Compass, accent: 'electric' },
  orga_detail: { cat: 'Orga & Ablauf', Icon: Compass, accent: 'electric' },
  laenge: { cat: 'Orga & Ablauf', Icon: Clock, accent: 'electric' },
  website: { cat: 'Die Website', Icon: MonitorSmartphone, accent: 'electric' },
  website_detail: { cat: 'Die Website', Icon: MonitorSmartphone, accent: 'electric' },
  wieder: { cat: 'Zum Schluss', Icon: Repeat, accent: 'moss' },
  kommentar: { cat: 'Zum Schluss', Icon: PenLine, accent: 'moss' },
}

type Answers = {
  rolle: FeedbackRolle | null
  klasse: string | null
  lehrerRolle: FeedbackLehrerRolle | null
  rating: number | null
  highlights: string[]
  kritik: string[]
  besteStation: string | null
  essen: FeedbackEssen | null
  essenDetail: string[]
  volleyball: FeedbackVolley | null
  orga: FeedbackOrga | null
  orgaDetail: string[]
  laenge: FeedbackLaenge | null
  website: FeedbackWebsite | null
  websiteDetail: string[]
  wieder: FeedbackWieder | null
  kommentar: string
}

const EMPTY: Answers = {
  rolle: null,
  klasse: null,
  lehrerRolle: null,
  rating: null,
  highlights: [],
  kritik: [],
  besteStation: null,
  essen: null,
  essenDetail: [],
  volleyball: null,
  orga: null,
  orgaDetail: [],
  laenge: null,
  website: null,
  websiteDetail: [],
  wieder: null,
  kommentar: '',
}

function jahrgangOf(klasse: string | null): number | null {
  if (!klasse) return null
  const m = klasse.match(/\d+/)
  return m ? Number(m[0]) : null
}

function moodOf(a: Answers): 'pos' | 'mixed' | 'neg' {
  let neg = 0
  if (a.rating !== null) {
    if (a.rating <= 2) neg += 2
    else if (a.rating === 3) neg += 1
  }
  if (a.kritik.length > 0) neg += 1
  if (a.essen === 'nicht-so') neg += 1
  if (a.orga === 'chaotisch') neg += 1
  else if (a.orga === 'okay') neg += 0.5
  if (a.laenge !== null && a.laenge !== 'genau-richtig') neg += 0.5
  if (a.website === 'ausbaufaehig') neg += 0.5
  if (neg >= 2) return 'neg'
  if ((a.rating ?? 0) >= 4 && neg < 1) return 'pos'
  return 'mixed'
}

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 56, filter: 'blur(4px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => ({ opacity: 0, x: dir * -56, filter: 'blur(4px)' }),
}

type SpeechRec = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

function useDictation(onText: (text: string) => void) {
  const recRef = useRef<SpeechRec | null>(null)
  const [listening, setListening] = useState(false)
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  const supported = typeof Ctor === 'function'

  useEffect(() => () => recRef.current?.stop(), [])

  const toggle = () => {
    if (listening) {
      recRef.current?.stop()
      return
    }
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = 'de-DE'
    rec.interimResults = false
    rec.continuous = true
    // iOS-Safari sendet finale Ergebnisse teils mit resultIndex 0 mehrfach — daher
    // nur wirklich neue Ergebnis-Slots (ab lastFinal) übernehmen, sonst gibt's Dubletten.
    let lastFinal = 0
    rec.onresult = (e) => {
      const start = Math.max(e.resultIndex, lastFinal)
      const chunk = Array.from({ length: e.results.length - start }, (_, k) => e.results[start + k]?.[0]?.transcript ?? '')
        .join(' ')
        .trim()
      lastFinal = e.results.length
      if (chunk) onText(chunk)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  return { supported, listening, toggle }
}

export default function Feedback() {
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Answers>(EMPTY)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [pending, setPending] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [done, setDone] = useState(false)
  const [confetti, setConfetti] = useState(0)
  const [klassen, setKlassen] = useState<string[]>(KLASSEN_FALLBACK)
  const [stationen, setStationen] = useState<string[]>(STATIONEN_FALLBACK)
  const [notes, setNotes] = useState({ kritik: '', essenDetail: '', orgaDetail: '', websiteDetail: '' })
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetchTeams()
      .then((teams) => teams.length && setKlassen(teams.map((t) => t.name)))
      .catch(() => {})
    fetchStationsPublic()
      .then((st) => {
        const names = st.filter((s) => s.aktiv && s.name !== 'Versorgung').map((s) => s.name)
        if (names.length) setStationen(names)
      })
      .catch(() => {})
    fetchFeedbackCount()
      .then(setCount)
      .catch(() => {})
  }, [])

  const jg = jahrgangOf(answers.klasse)
  const zeigVolley = answers.rolle === 'lehrkraft' || (answers.rolle === 'schueler' && (jg === null || (jg >= 7 && jg <= 10)))
  const mood = moodOf(answers)

  const steps = useMemo(() => {
    const s: StepId[] = ['rolle']
    if (answers.rolle === 'schueler') s.push('klasse')
    if (answers.rolle === 'lehrkraft') s.push('lehrerrolle')
    s.push('rating')
    if (answers.rating !== null && answers.rating <= 3) s.push('kritik')
    s.push('highlights', 'station', 'essen')
    if (answers.essen === 'okay' || answers.essen === 'nicht-so') s.push('essen_detail')
    if (zeigVolley) s.push('volleyball')
    s.push('orga')
    if (answers.orga === 'okay' || answers.orga === 'chaotisch') s.push('orga_detail')
    s.push('laenge', 'website')
    if (answers.website === 'ausbaufaehig') s.push('website_detail')
    s.push('wieder', 'kommentar')
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.rolle, answers.rating, answers.klasse, answers.essen, answers.orga, answers.website])

  const step = steps[Math.min(i, steps.length - 1)]
  const meta = STEP_META[step]
  const accent = ACCENT[meta.accent]

  const advanceTimer = useRef<number | undefined>(undefined)
  const stepsRef = useRef(steps)
  stepsRef.current = steps
  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  const goNext = () => {
    setDir(1)
    setI((v) => Math.min(v + 1, steps.length - 1))
  }
  const goBack = () => {
    if (i === 0) return
    // Ein noch laufendes Auto-Advance abbrechen, sonst springt es nach „Zurück" wieder vor.
    window.clearTimeout(advanceTimer.current)
    setDir(-1)
    setPending(null)
    setI((v) => v - 1)
  }

  const choose = (key: string, apply: () => void) => {
    if (pending) return
    setPending(key)
    window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => {
      apply()
      setPending(null)
      setDir(1)
      setI((v) => Math.min(v + 1, stepsRef.current.length - 1))
    }, 300)
  }

  const toggleIn = (field: 'highlights' | 'kritik' | 'essenDetail' | 'orgaDetail' | 'websiteDetail', value: string) =>
    setAnswers((a) => ({ ...a, [field]: a[field].includes(value) ? a[field].filter((x) => x !== value) : [...a[field], value] }))

  const withNote = (arr: string[], note: string) =>
    arr.map((x) => (x === 'Sonstiges' && note.trim() ? `Sonstiges: ${note.trim()}` : x))

  const dictation = useDictation((text) =>
    setAnswers((a) => ({ ...a, kommentar: `${a.kommentar ? a.kommentar.trimEnd() + ' ' : ''}${text}`.slice(0, 500) })),
  )

  const send = async () => {
    if (answers.rating === null || busy) return
    setBusy(true)
    setError(false)
    try {
      const res = await submitFeedback({
        rating: answers.rating,
        rolle: answers.rolle,
        klasse: answers.rolle === 'schueler' ? answers.klasse : null,
        lehrerRolle: answers.rolle === 'lehrkraft' ? answers.lehrerRolle : null,
        highlights: answers.highlights,
        kritik: answers.rating <= 3 ? withNote(answers.kritik, notes.kritik) : [],
        besteStation: answers.besteStation,
        essen: answers.essen,
        essenDetail: answers.essen === 'okay' || answers.essen === 'nicht-so' ? withNote(answers.essenDetail, notes.essenDetail) : [],
        volleyball: zeigVolley ? answers.volleyball : null,
        orga: answers.orga,
        orgaDetail: answers.orga === 'okay' || answers.orga === 'chaotisch' ? withNote(answers.orgaDetail, notes.orgaDetail) : [],
        laenge: answers.laenge,
        website: answers.website,
        websiteDetail: answers.website === 'ausbaufaehig' ? withNote(answers.websiteDetail, notes.websiteDetail) : [],
        wieder: answers.wieder,
        kommentar: answers.kommentar,
      })
      if (!res.ok) throw new Error(res.error)
      setDone(true)
      setConfetti((k) => k + 1)
      fetchFeedbackCount()
        .then(setCount)
        .catch(() => {})
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  const restart = () => {
    setAnswers(EMPTY)
    setNotes({ kritik: '', essenDetail: '', orgaDetail: '', websiteDetail: '' })
    setError(false)
    setDone(false)
    setStarted(false)
    setDir(1)
    setI(0)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <ConfettiBurst fireKey={confetti} />
      <InkBackground />
      <AmbientBlobs />

      <main className="relative mx-auto w-full max-w-xl flex-1 px-5 pb-16 pt-10 sm:pt-14">
        <AnimatePresence mode="wait">
          {done ? (
            <DoneCard key="done" rating={answers.rating ?? 0} nr={count} onRestart={restart} />
          ) : !started ? (
            <IntroCard key="intro" count={count} onStart={() => setStarted(true)} />
          ) : (
            <motion.div key="wizard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <div className="h-1.5 rounded-full bg-graphite/[0.06]" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={i + 1} aria-label="Fortschritt">
                <motion.div
                  className="relative h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg,#00662c,#23a85a 55%,#5eead4)',
                    boxShadow: '0 0 14px rgba(35,168,90,0.55)',
                  }}
                  animate={{ width: `${((i + 1) / steps.length) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 110, damping: 20 }}
                >
                  <motion.span
                    aria-hidden
                    className="absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-electric-400"
                    animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1.15, 0.9] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ boxShadow: '0 0 10px rgba(94,234,212,0.9)' }}
                  />
                </motion.div>
              </div>

              <div className="mt-4 rounded-[28px] bg-white shadow-card ring-1 ring-black/5">
                <AnimatedHeight>
                  <div className="p-6 sm:p-8">
                    <AnimatePresence mode="wait" custom={dir} initial={false}>
                      <motion.div
                        key={step}
                        custom={dir}
                        variants={slide}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={cx('grid h-8 w-8 place-items-center rounded-xl', accent.tile)}>
                            <meta.Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                          </span>
                          <span className="label-mono text-[11px] text-graphite-soft">{meta.cat}</span>
                        </div>

                        {step === 'rolle' && (
                          <StepShell title="Wer bist du?">
                            <div className="mt-6 grid gap-2.5">
                              {(
                                [
                                  { id: 'schueler', label: 'Schüler:in', sub: 'Ich war mit meiner Klasse dabei', Icon: GraduationCap },
                                  { id: 'lehrkraft', label: 'Lehrkraft', sub: 'Ich habe begleitet oder betreut', Icon: School },
                                  { id: 'gast', label: 'Eltern & Gäste', sub: 'Ich war zu Besuch', Icon: Users },
                                ] as const
                              ).map(({ id, label, sub, Icon }) => (
                                <ChoiceRow
                                  key={id}
                                  Icon={Icon}
                                  label={label}
                                  sub={sub}
                                  accent={meta.accent}
                                  selected={answers.rolle === id}
                                  pending={pending === id}
                                  onClick={() =>
                                    choose(id, () =>
                                      setAnswers((a) => ({
                                        ...a,
                                        rolle: id,
                                        klasse: id === 'schueler' ? a.klasse : null,
                                        lehrerRolle: id === 'lehrkraft' ? a.lehrerRolle : null,
                                        volleyball: null,
                                      })),
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </StepShell>
                        )}

                        {step === 'klasse' && (
                          <StepShell title="In welcher Klasse bist du?">
                            <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-5">
                              {klassen.map((k) => (
                                <motion.button
                                  key={k}
                                  type="button"
                                  whileTap={{ scale: 0.93 }}
                                  onClick={() => choose(k, () => setAnswers((a) => ({ ...a, klasse: k, volleyball: null })))}
                                  className={cx(
                                    'rounded-2xl px-2 py-3 text-sm font-bold tabular ring-1 transition',
                                    (pending ?? answers.klasse) === k ? ACCENT.moss.sel : cx('bg-paper text-graphite ring-black/[0.06]', accent.hover),
                                  )}
                                >
                                  {k}
                                </motion.button>
                              ))}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {['Jahrgang 11', 'Jahrgang 12'].map((k) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => choose(k, () => setAnswers((a) => ({ ...a, klasse: k, volleyball: null })))}
                                  className={cx(
                                    'rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition',
                                    (pending ?? answers.klasse) === k ? ACCENT.moss.sel : cx('bg-paper text-graphite ring-black/[0.06]', accent.hover),
                                  )}
                                >
                                  {k}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => choose('skip', () => setAnswers((a) => ({ ...a, klasse: null, volleyball: null })))}
                                className="rounded-2xl px-4 py-3 text-sm font-semibold text-graphite-soft transition hover:bg-graphite/[0.05] hover:text-graphite"
                              >
                                Sag ich nicht
                              </button>
                            </div>
                          </StepShell>
                        )}

                        {step === 'lehrerrolle' && (
                          <StepShell title="Was war deine Rolle an dem Tag?">
                            <div className="mt-6 grid gap-2.5">
                              {(
                                [
                                  { id: 'station', label: 'Stationsbetreuung', sub: 'Ich habe eine Station geleitet' },
                                  { id: 'begleitung', label: 'Klassenbegleitung', sub: 'Ich war mit einer Klasse unterwegs' },
                                  { id: 'dabei', label: 'Einfach dabei', sub: 'Ohne feste Aufgabe' },
                                ] as const
                              ).map(({ id, label, sub }) => (
                                <ChoiceRow
                                  key={id}
                                  label={label}
                                  sub={sub}
                                  accent={meta.accent}
                                  selected={answers.lehrerRolle === id}
                                  pending={pending === id}
                                  onClick={() => choose(id, () => setAnswers((a) => ({ ...a, lehrerRolle: id })))}
                                />
                              ))}
                            </div>
                          </StepShell>
                        )}

                        {step === 'rating' && (
                          <StepShell title="Wie war das Sommerfest insgesamt?">
                            <BarRating
                              value={answers.rating}
                              onChange={(v) => {
                                if (pending) return
                                setAnswers((a) => ({ ...a, rating: v, kritik: v > 3 ? [] : a.kritik }))
                                setPending('rating')
                                window.clearTimeout(advanceTimer.current)
                                advanceTimer.current = window.setTimeout(() => {
                                  setPending(null)
                                  goNext()
                                }, 750)
                              }}
                            />
                          </StepShell>
                        )}

                        {step === 'kritik' && (
                          <StepShell
                            title="Woran lag's?"
                            sub={
                              answers.rating === 3
                                ? 'Eine 3 — da war mehr drin. Was hat gestört?'
                                : `Autsch, eine ${answers.rating}. Dann mal Klartext — was hat genervt?`
                            }
                          >
                            <ChipQuestion
                              items={KRITIK}
                              active={answers.kritik}
                              accent="crimson"
                              onToggle={(k) => toggleIn('kritik', k)}
                              note={notes.kritik}
                              onNote={(v) => setNotes((n) => ({ ...n, kritik: v }))}
                              onNext={goNext}
                            />
                          </StepShell>
                        )}

                        {step === 'highlights' && (
                          <StepShell title="Was war top?">
                            <ChipGrid items={HIGHLIGHTS} active={answers.highlights} accent="moss" onToggle={(h) => toggleIn('highlights', h)} />
                            <NextButton onClick={goNext} skip={answers.highlights.length === 0} />
                          </StepShell>
                        )}

                        {step === 'station' && (
                          <StepShell
                            title="Welche Station war die beste?"
                            sub={answers.highlights.includes('Stationen') ? 'Du hast die Stationen als Highlight markiert — welche war es?' : undefined}
                          >
                            <div className="mt-6 grid grid-cols-2 gap-2">
                              {stationen.map((s) => (
                                <motion.button
                                  key={s}
                                  type="button"
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => choose(s, () => setAnswers((a) => ({ ...a, besteStation: s })))}
                                  className={cx(
                                    'rounded-2xl px-3 py-3 text-sm font-semibold ring-1 transition',
                                    (pending ?? answers.besteStation) === s ? ACCENT.electric.sel : cx('bg-paper text-graphite ring-black/[0.06]', accent.hover),
                                  )}
                                >
                                  {s}
                                </motion.button>
                              ))}
                            </div>
                            <div className="mt-3 flex justify-center">
                              <button
                                type="button"
                                onClick={() => choose('skip', () => setAnswers((a) => ({ ...a, besteStation: null })))}
                                className="rounded-full px-4 py-2.5 text-sm font-semibold text-graphite-soft transition hover:bg-graphite/[0.05] hover:text-graphite"
                              >
                                Kann mich nicht entscheiden
                              </button>
                            </div>
                          </StepShell>
                        )}

                        {step === 'essen' && (
                          <StepShell
                            title="Und das Essen?"
                            sub={answers.highlights.includes('Grillen & Foodcourt') ? 'Foodcourt war für dich ein Highlight — wie war es im Detail?' : undefined}
                          >
                            <div className="mt-6 grid gap-2.5">
                              {(
                                [
                                  { id: 'lecker', label: 'Richtig lecker', sub: 'Gerne genau so wieder' },
                                  { id: 'okay', label: 'War okay', sub: 'Kein Highlight, kein Reinfall' },
                                  { id: 'nicht-so', label: 'Nicht so meins', sub: 'Da geht mehr' },
                                  { id: 'nicht-da', label: 'War nicht dort', sub: 'Kann ich nicht bewerten' },
                                ] as const
                              ).map(({ id, label, sub }) => (
                                <ChoiceRow
                                  key={id}
                                  label={label}
                                  sub={sub}
                                  accent={meta.accent}
                                  selected={answers.essen === id}
                                  pending={pending === id}
                                  onClick={() =>
                                    choose(id, () =>
                                      setAnswers((a) => ({
                                        ...a,
                                        essen: id,
                                        essenDetail: id === 'okay' || id === 'nicht-so' ? a.essenDetail : [],
                                      })),
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </StepShell>
                        )}

                        {step === 'essen_detail' && (
                          <StepShell
                            title={answers.essen === 'nicht-so' ? 'Was war beim Essen nicht gut?' : 'Was hätte das Essen besser gemacht?'}
                            sub={
                              answers.essen === 'nicht-so'
                                ? '„Nicht so meins", hast du gesagt — woran lag es?'
                                : '„War okay", hast du gesagt — was fehlte zu richtig lecker?'
                            }
                          >
                            <ChipQuestion
                              items={ESSEN_DETAIL}
                              active={answers.essenDetail}
                              accent="crimson"
                              onToggle={(k) => toggleIn('essenDetail', k)}
                              note={notes.essenDetail}
                              onNote={(v) => setNotes((n) => ({ ...n, essenDetail: v }))}
                              onNext={goNext}
                            />
                          </StepShell>
                        )}

                        {step === 'volleyball' && (
                          <StepShell
                            title="Warst du beim Volleyball-Turnier dabei?"
                            sub={
                              answers.rolle === 'schueler' && answers.klasse && jg !== null && jg >= 7 && jg <= 10
                                ? `Die ${answers.klasse} war in der Halle am Start — und du?`
                                : undefined
                            }
                          >
                            <div className="mt-6 grid gap-2.5">
                              {(
                                [
                                  { id: 'gespielt', label: 'Selbst gespielt', sub: 'Ich stand auf dem Feld' },
                                  { id: 'zugeschaut', label: 'Zugeschaut & angefeuert', sub: 'Tribüne statt Spielfeld' },
                                  { id: 'verpasst', label: "Hab's verpasst", sub: 'War woanders unterwegs' },
                                ] as const
                              ).map(({ id, label, sub }) => (
                                <ChoiceRow
                                  key={id}
                                  label={label}
                                  sub={sub}
                                  accent={meta.accent}
                                  selected={answers.volleyball === id}
                                  pending={pending === id}
                                  onClick={() => choose(id, () => setAnswers((a) => ({ ...a, volleyball: id })))}
                                />
                              ))}
                            </div>
                          </StepShell>
                        )}

                        {step === 'orga' && (
                          <StepShell title="Wie rund lief der Tag?">
                            <div className="mt-6 grid gap-2.5">
                              {(
                                [
                                  { id: 'rund', label: 'Lief wie am Schnürchen', sub: 'Kaum Leerlauf, klare Ansagen' },
                                  { id: 'okay', label: 'Ging so', sub: 'Ein paar Hänger, aber okay' },
                                  { id: 'chaotisch', label: 'Ziemlich chaotisch', sub: 'Viel Warterei oder Verwirrung' },
                                ] as const
                              ).map(({ id, label, sub }) => (
                                <ChoiceRow
                                  key={id}
                                  label={label}
                                  sub={sub}
                                  accent={meta.accent}
                                  selected={answers.orga === id}
                                  pending={pending === id}
                                  onClick={() =>
                                    choose(id, () =>
                                      setAnswers((a) => ({
                                        ...a,
                                        orga: id,
                                        orgaDetail: id === 'okay' || id === 'chaotisch' ? a.orgaDetail : [],
                                      })),
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </StepShell>
                        )}

                        {step === 'orga_detail' && (
                          <StepShell
                            title={answers.orga === 'chaotisch' ? 'Wo genau hat es gehakt?' : 'Was hätte den Tag runder gemacht?'}
                            sub={
                              answers.orga === 'chaotisch'
                                ? '„Ziemlich chaotisch", hast du gesagt — hilf uns, die Stellen zu finden.'
                                : '„Ging so", hast du gesagt — wo war der Sand im Getriebe?'
                            }
                          >
                            <ChipQuestion
                              items={ORGA_DETAIL}
                              active={answers.orgaDetail}
                              accent="crimson"
                              onToggle={(k) => toggleIn('orgaDetail', k)}
                              note={notes.orgaDetail}
                              onNote={(v) => setNotes((n) => ({ ...n, orgaDetail: v }))}
                              onNext={goNext}
                            />
                          </StepShell>
                        )}

                        {step === 'laenge' && (
                          <StepShell title="Und die Länge des Tages?">
                            <div className="mt-6 grid gap-2.5">
                              {(
                                [
                                  { id: 'zu-kurz', label: 'Hätte länger gehen können', sub: 'Ich war noch nicht fertig' },
                                  { id: 'genau-richtig', label: 'Genau richtig', sub: 'Gutes Pensum' },
                                  { id: 'zu-lang', label: 'Zu lang', sub: 'Am Ende war die Luft raus' },
                                ] as const
                              ).map(({ id, label, sub }) => (
                                <ChoiceRow
                                  key={id}
                                  label={label}
                                  sub={sub}
                                  accent={meta.accent}
                                  selected={answers.laenge === id}
                                  pending={pending === id}
                                  onClick={() => choose(id, () => setAnswers((a) => ({ ...a, laenge: id })))}
                                />
                              ))}
                            </div>
                          </StepShell>
                        )}

                        {step === 'website' && (
                          <StepShell title="Und diese Website hier?">
                            <div className="mt-6 grid gap-2.5">
                              {(
                                [
                                  { id: 'top', label: 'Coole Idee, gut umgesetzt', sub: 'Lief bei mir sauber' },
                                  { id: 'ausbaufaehig', label: 'Coole Idee, aber es hakte', sub: 'Da ist noch Luft nach oben' },
                                  { id: 'nicht-genutzt', label: 'Hab sie kaum genutzt', sub: 'Heute quasi das erste Mal hier' },
                                ] as const
                              ).map(({ id, label, sub }) => (
                                <ChoiceRow
                                  key={id}
                                  label={label}
                                  sub={sub}
                                  accent={meta.accent}
                                  selected={answers.website === id}
                                  pending={pending === id}
                                  onClick={() =>
                                    choose(id, () =>
                                      setAnswers((a) => ({
                                        ...a,
                                        website: id,
                                        websiteDetail: id === 'ausbaufaehig' ? a.websiteDetail : [],
                                      })),
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </StepShell>
                        )}

                        {step === 'website_detail' && (
                          <StepShell title="Was hat an der Website gehakt?">
                            <ChipQuestion
                              items={WEBSITE_DETAIL}
                              active={answers.websiteDetail}
                              accent="crimson"
                              onToggle={(k) => toggleIn('websiteDetail', k)}
                              note={notes.websiteDetail}
                              onNote={(v) => setNotes((n) => ({ ...n, websiteDetail: v }))}
                              onNext={goNext}
                            />
                          </StepShell>
                        )}

                        {step === 'wieder' && (
                          <StepShell
                            title="Sommerfest 2027 — bist du dabei?"
                            sub={
                              mood === 'pos'
                                ? 'Klingt so, als hättest du Bock auf die nächste Runde.'
                                : mood === 'neg'
                                  ? 'Du hast einiges kritisiert — ehrlich: Gibst du dem Fest noch eine Chance?'
                                  : 'Licht und Schatten also — wäre ein nächstes Mal trotzdem drin?'
                            }
                          >
                            <div className="mt-6 grid gap-2.5">
                              {(
                                [
                                  { id: 'ja', label: 'Ja, auf jeden Fall', sub: 'Genau so wieder', Icon: PartyPopper },
                                  { id: 'mit-aenderungen', label: 'Ja, aber mit Änderungen', sub: 'Gute Idee, Luft nach oben', Icon: Wrench },
                                  { id: 'nein', label: 'Lieber nicht', sub: 'Hat mich nicht überzeugt', Icon: ThumbsDown },
                                ] as const
                              ).map(({ id, label, sub, Icon }) => (
                                <ChoiceRow
                                  key={id}
                                  Icon={Icon}
                                  label={label}
                                  sub={sub}
                                  accent={meta.accent}
                                  selected={answers.wieder === id}
                                  pending={pending === id}
                                  onClick={() => choose(id, () => setAnswers((a) => ({ ...a, wieder: id })))}
                                />
                              ))}
                            </div>
                          </StepShell>
                        )}

                        {step === 'kommentar' && (
                          <StepShell
                            title="Möchtest du noch etwas hinzufügen?"
                            sub={
                              mood === 'pos'
                                ? 'Zum Beispiel dein Moment des Tages — oder was 2027 nicht fehlen darf.'
                                : mood === 'neg'
                                  ? 'Zum Beispiel, was wir als Erstes ändern sollten.'
                                  : 'Lob, Kritik, Ideen — alles landet ungefiltert bei der Orga.'
                            }
                          >
                            <textarea
                              value={answers.kommentar}
                              onChange={(e) => setAnswers((a) => ({ ...a, kommentar: e.target.value }))}
                              maxLength={500}
                              rows={4}
                              placeholder={mood === 'pos' ? 'Der eine Augenblick, der hängen bleibt …' : "Sag's ehrlich — die Orga liest alles."}
                              className="mt-6 w-full resize-none rounded-2xl border border-graphite/10 bg-paper px-4 py-3 text-base font-medium text-graphite outline-none transition placeholder:text-graphite-soft/50 focus:border-moss-500 focus:bg-white focus:ring-4 focus:ring-moss-500/15"
                            />
                            <div className="mt-1.5 flex items-center justify-between gap-3">
                              {dictation.supported ? (
                                <button
                                  type="button"
                                  onClick={dictation.toggle}
                                  className={cx(
                                    'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition',
                                    dictation.listening
                                      ? 'bg-crimson-500/10 text-crimson-600'
                                      : 'bg-graphite/[0.05] text-graphite-soft hover:bg-graphite/[0.09] hover:text-graphite',
                                  )}
                                >
                                  {dictation.listening ? (
                                    <>
                                      <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-crimson-500" />
                                      </span>
                                      Aufnahme läuft — zum Stoppen tippen
                                    </>
                                  ) : (
                                    <>
                                      <Mic className="h-3.5 w-3.5" /> Diktieren
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span />
                              )}
                              {answers.kommentar.length >= 400 && (
                                <span className="text-xs tabular text-graphite-soft">{500 - answers.kommentar.length} Zeichen übrig</span>
                              )}
                            </div>
                            <AnimatePresence>
                              {error && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 overflow-hidden rounded-2xl bg-crimson-500/10 px-4 py-3 text-sm font-semibold text-crimson-600"
                                >
                                  Senden hat nicht geklappt — prüf kurz dein Internet und versuch&apos;s nochmal.
                                </motion.p>
                              )}
                            </AnimatePresence>
                            <div className="mt-6 flex items-center justify-end">
                              <motion.button
                                whileTap={busy ? undefined : { scale: 0.97 }}
                                disabled={busy}
                                onClick={send}
                                className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] transition hover:bg-moss-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {busy ? (
                                  <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                  <Send className="h-[18px] w-[18px]" />
                                )}
                                Feedback senden
                              </motion.button>
                            </div>
                          </StepShell>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </AnimatedHeight>
              </div>

              <div className="mt-3 flex h-11 items-center justify-between">
                <div>
                  {i > 0 && (
                    <button
                      onClick={goBack}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-graphite-soft transition hover:bg-graphite/[0.05] hover:text-graphite"
                    >
                      <ArrowLeft className="h-4 w-4" /> Zurück
                    </button>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 pr-1 text-xs font-semibold text-graphite-soft">
                  <Lock className="h-3.5 w-3.5 text-moss-600" /> Anonym
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <SiteFooter />
    </div>
  )
}

function AnimatedHeight({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <motion.div
      animate={{ height }}
      transition={{ type: 'spring', stiffness: 170, damping: 26 }}
      className="overflow-hidden rounded-[28px]"
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  )
}

function AmbientBlobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      <motion.div
        className="absolute -left-24 top-[16%] h-96 w-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(35,168,90,0.2), transparent 70%)', filter: 'blur(30px)' }}
        animate={{ y: [0, 44, 0], x: [0, 26, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-24 top-[38%] h-[26rem] w-[26rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)', filter: 'blur(34px)' }}
        animate={{ y: [0, -38, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[28%] h-80 w-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.18), transparent 70%)', filter: 'blur(28px)' }}
        animate={{ y: [0, -30, 0], x: [0, -22, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </div>
  )
}

function IntroCard({ count, onStart }: { count: number | null; onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 100, damping: 17 }}
      className="relative overflow-hidden rounded-[28px] bg-white p-7 shadow-card ring-1 ring-black/5 sm:p-10"
    >
      <motion.img
        src="/illus/trophy.png?v=2"
        alt=""
        aria-hidden
        className="absolute -right-6 -top-4 w-32 rotate-12 opacity-90 sm:w-40"
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="inline-flex items-center gap-2 rounded-full bg-moss-600/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-moss-700">
        Feedback · Sommerfest 2026
      </span>
      <h1 className="mt-5 max-w-sm font-display text-4xl leading-[1.05] text-graphite sm:text-5xl">
        Wie war der Tag <span className="text-moss-600">wirklich</span>?
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-graphite-soft">
        Punkte und Platzierungen stehen fest — jetzt fehlt deine ehrliche Meinung. Sag uns, was stark war und was 2027 anders laufen muss.
      </p>
      <ul className="mt-7 grid gap-3 text-sm font-medium text-graphite sm:grid-cols-3">
        {(
          [
            { Icon: GitBranch, text: 'Fragen passen sich deinen Antworten an' },
            { Icon: Timer, text: 'In rund 90 Sekunden durch' },
            { Icon: Lock, text: 'Komplett anonym' },
          ] as const
        ).map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5 sm:flex-col sm:items-start">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss-600/10 text-moss-700">
              <Icon className="h-4 w-4" />
            </span>
            {text}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-moss-600 px-7 py-4 text-base font-semibold text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] transition hover:bg-moss-700 sm:w-auto"
        >
          Los geht&apos;s <ArrowRight className="h-4 w-4" />
        </motion.button>
        {count !== null && count >= 5 && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-sm font-bold text-moss-700"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-moss-500" />
            </span>
            Schon <AnimatedNumber value={count} /> Stimmen abgegeben
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}

function StepShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h2 className="font-display text-[26px] leading-tight text-graphite sm:text-3xl">{title}</h2>
      {sub && <p className="mt-2 text-sm text-graphite-soft sm:text-[15px]">{sub}</p>}
      {children}
    </div>
  )
}

function ChoiceRow({
  Icon,
  label,
  sub,
  accent,
  selected,
  pending,
  onClick,
}: {
  Icon?: LucideIcon
  label: string
  sub: string
  accent: Accent
  selected: boolean
  pending: boolean
  onClick: () => void
}) {
  const a = ACCENT[accent]
  const active = pending || selected
  const darkText = accent === 'brass' || accent === 'electric'
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      whileHover={active ? undefined : { y: -1 }}
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'flex items-center gap-3.5 rounded-2xl p-4 text-left ring-1 transition',
        active ? a.sel : cx('bg-paper ring-black/[0.06]', a.hover),
      )}
    >
      {Icon && (
        <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-full', active ? (darkText ? 'bg-black/[0.08]' : 'bg-white/15') : a.tile)}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cx('block font-bold', active ? '' : 'text-graphite')}>{label}</span>
        <span className={cx('block text-[13px]', active ? (darkText ? 'opacity-75' : 'text-white/80') : 'text-graphite-soft')}>{sub}</span>
      </span>
      {pending && (
        <span
          className={cx(
            'h-4 w-4 shrink-0 animate-spin rounded-full border-2',
            darkText ? 'border-black/25 border-t-black/70' : 'border-white/40 border-t-white',
          )}
        />
      )}
    </motion.button>
  )
}

function ChipGrid({
  items,
  active,
  accent,
  onToggle,
}: {
  items: string[]
  active: string[]
  accent: Accent
  onToggle: (item: string) => void
}) {
  const a = ACCENT[accent]
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {items.map((item) => {
        const on = active.includes(item)
        return (
          <motion.button
            key={item}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onToggle(item)}
            aria-pressed={on}
            className={cx(
              'rounded-full px-4 py-2.5 text-sm font-medium ring-1 transition',
              on ? a.sel : cx('bg-paper text-graphite ring-black/[0.06]', a.hover),
            )}
          >
            {item}
          </motion.button>
        )
      })}
    </div>
  )
}

function ChipQuestion({
  items,
  active,
  accent,
  onToggle,
  note,
  onNote,
  onNext,
}: {
  items: string[]
  active: string[]
  accent: Accent
  onToggle: (item: string) => void
  note: string
  onNote: (v: string) => void
  onNext: () => void
}) {
  const needsNote = active.includes('Sonstiges')
  return (
    <>
      <ChipGrid items={items} active={active} accent={accent} onToggle={onToggle} />
      <AnimatePresence initial={false}>
        {needsNote && (
          <motion.div
            key="sonstiges-note"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <label className="mt-4 block px-0.5 pb-0.5">
              <span className="text-[13px] font-semibold text-graphite-soft">Sonstiges — was genau?</span>
              <input
                value={note}
                onChange={(e) => onNote(e.target.value)}
                maxLength={52}
                autoFocus
                placeholder="Kurz beschreiben …"
                className="mt-1.5 w-full rounded-2xl border border-graphite/10 bg-paper px-4 py-3 text-base font-medium text-graphite outline-none transition placeholder:text-graphite-soft/50 focus:border-moss-500 focus:bg-white focus:ring-4 focus:ring-moss-500/15"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
      <NextButton onClick={onNext} skip={active.length === 0} disabled={needsNote && !note.trim()} />
    </>
  )
}

function NextButton({ onClick, skip, disabled }: { onClick: () => void; skip: boolean; disabled?: boolean }) {
  return (
    <div className="mt-7 flex justify-end">
      <motion.button
        layout
        whileTap={disabled ? undefined : { scale: 0.97 }}
        disabled={disabled}
        onClick={onClick}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className={cx(
          'inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors duration-300',
          'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
          skip
            ? 'bg-graphite/[0.06] text-graphite hover:bg-graphite/[0.1]'
            : 'bg-moss-600 text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] hover:bg-moss-700',
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={skip ? 'skip' : 'next'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            {skip ? 'Überspringen' : 'Weiter'} <ArrowRight className="h-4 w-4" />
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

function BarRating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Bewertung von 1 bis 5" className="mt-8">
      <div className="flex items-end gap-3">
        {BAR_HEIGHTS.map((h, idx) => {
          const active = value !== null && idx < value
          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={value === idx + 1}
              aria-label={`${idx + 1} von 5 — ${RATING_WORDS[idx]}`}
              onClick={() => onChange(idx + 1)}
              className="group flex flex-1 flex-col items-center gap-1.5"
            >
              <motion.span
                key={active ? 'on' : 'off'}
                initial={false}
                animate={active ? { scaleY: [0.7, 1.08, 1] } : { scaleY: 1 }}
                transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1], delay: active ? idx * 0.04 : 0 }}
                className={cx('block w-full rounded-[10px] transition-colors', !active && 'bg-graphite/[0.08] group-hover:bg-moss-600/25')}
                style={{
                  height: h,
                  transformOrigin: 'bottom',
                  background: active ? 'linear-gradient(0deg,#00662c,#23a85a)' : undefined,
                }}
              />
              <span className={cx('text-xs font-semibold tabular transition-colors', active ? 'text-moss-700' : 'text-graphite-soft')}>{idx + 1}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-2 h-7 text-center">
        <AnimatePresence mode="wait">
          {value !== null && (
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="inline-block text-base font-bold text-moss-700"
            >
              {RATING_WORDS[value - 1]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function DoneCard({ rating, nr, onRestart }: { rating: number; nr: number | null; onRestart: () => void }) {
  const { View } = useLottie({ animationData: checkAnim, autoplay: true, loop: false }, { width: 120, height: 120 })
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 130, damping: 16 }}
      className="grid place-items-center rounded-[28px] bg-white px-6 py-12 text-center shadow-card ring-1 ring-black/5"
    >
      <div className="h-[120px] w-[120px]">{View}</div>
      <h1 className="mt-2 font-display text-4xl text-graphite">Danke dir!</h1>
      {nr !== null && nr > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-3 inline-flex items-center rounded-full bg-moss-600/10 px-4 py-1.5 text-sm font-bold text-moss-700"
        >
          Du bist Stimme Nr. {nr}
        </motion.span>
      )}
      <div className="mt-5 flex items-end gap-1.5" aria-label={`Deine Wertung: ${rating} von 5`}>
        {BAR_HEIGHTS.map((h, idx) => (
          <motion.span
            key={idx}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 17, delay: 0.35 + idx * 0.06 }}
            className="block w-6 rounded-[6px]"
            style={{
              height: h * 0.45,
              transformOrigin: 'bottom',
              background: idx < rating ? 'linear-gradient(0deg,#00662c,#23a85a)' : 'rgba(16,24,40,0.08)',
            }}
          />
        ))}
      </div>
      <p className="mt-5 max-w-sm text-graphite-soft">
        {rating >= 4
          ? 'Dein Feedback ist bei der Orga vom Jahrgang 11 gelandet — schön, dass es dir gefallen hat!'
          : 'Dein Feedback ist bei der Orga vom Jahrgang 11 gelandet — ehrliche Kritik bringt das Fest weiter.'}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/rangliste"
          className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] transition hover:bg-moss-700"
        >
          <Trophy className="h-[18px] w-[18px]" /> Zum Live-Scoreboard
        </Link>
        <button
          onClick={onRestart}
          className="rounded-full bg-moss-600/10 px-5 py-3 text-sm font-semibold text-moss-700 transition hover:bg-moss-600/15"
        >
          Noch ein Feedback senden
        </button>
      </div>
    </motion.div>
  )
}
