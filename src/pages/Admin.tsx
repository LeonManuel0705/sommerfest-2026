import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { useLottie } from 'lottie-react'
import { ArrowLeft, LayoutGrid, Lock, Mail, ScrollText, Target, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchScores, fetchStationsAdmin, fetchTeams, signIn, signOut } from '@/lib/api'
import type { Score, StationAdmin, Team } from '@/lib/types'
import { Brand } from '@/components/Brand'
import { SkyBackground } from '@/components/SkyBackground'
import { Button, EmblemLoader } from '@/components/ui'
import { TeamsTab } from '@/components/admin/TeamsTab'
import { StationsTab } from '@/components/admin/StationsTab'
import { OverviewTab } from '@/components/admin/OverviewTab'
import { AuditTab } from '@/components/admin/AuditTab'
import { cx } from '@/lib/format'
import { spring } from '@/lib/motion'
import lockAnim from '@/assets/lottie/lock-green-tick.json'

const GLASS: React.CSSProperties = {
  background: 'linear-gradient(155deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
  backdropFilter: 'blur(3px) saturate(140%)',
  WebkitBackdropFilter: 'blur(3px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow:
    '0 30px 60px -28px rgba(28,58,108,0.4), 0 10px 26px -16px rgba(28,58,108,0.22), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 0 0 1px rgba(255,255,255,0.07)',
}

function TopGloss() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-14"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.24), transparent)' }}
    />
  )
}

type Tab = 'overview' | 'teams' | 'stations' | 'audit'
const TABS: Array<{ id: Tab; label: string; Icon: LucideIcon }> = [
  { id: 'overview', label: 'Übersicht', Icon: LayoutGrid },
  { id: 'teams', label: 'Klassen', Icon: Users },
  { id: 'stations', label: 'Stationen', Icon: Target },
  { id: 'audit', label: 'Protokoll', Icon: ScrollText },
]

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [unlocked, setUnlocked] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [teams, setTeams] = useState<Team[]>([])
  const [stations, setStations] = useState<StationAdmin[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const loadData = useCallback(async () => {
    setDataLoading(true)
    const [t, s, sc] = await Promise.all([fetchTeams(), fetchStationsAdmin(), fetchScores()])
    setTeams(t)
    setStations(s)
    setScores(sc)
    setDataLoading(false)
  }, [])

  const reloadScores = useCallback(async () => {
    try {
      setScores(await fetchScores())
    } catch {
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        setUnlocked(true)
        loadData()
      }
      setAuthLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) setUnlocked(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadData])

  useEffect(() => {
    if (!session || !unlocked) return
    const ch = supabase
      .channel('admin-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, reloadScores)
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [session, unlocked, reloadScores])

  if (authLoading)
    return (
      <div className="grid min-h-dvh place-items-center">
        <EmblemLoader />
      </div>
    )

  return (
    <div className="relative">
      <SkyBackground />
      <AnimatePresence mode="wait">
        {loggingOut ? (
          <motion.div key="logout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LogoutAnimation
              onDone={async () => {
                await signOut()
                setLoggingOut(false)
                setUnlocked(false)
              }}
            />
          </motion.div>
        ) : !session || !unlocked ? (
          <motion.div
            key="gate"
            exit={{ opacity: 0, scale: 1.06, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.6, 0, 0.2, 1] }}
          >
            <LoginGate onAuthenticated={loadData} onUnlocked={() => setUnlocked(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="shell"
            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <AdminShell
              email={session.user.email ?? ''}
              teams={teams}
              stations={stations}
              scores={scores}
              loading={dataLoading}
              reload={loadData}
              onLogout={() => setLoggingOut(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({
  icon: Icon,
  value,
  onChange,
  ...props
}: {
  icon: LucideIcon
  value: string
  onChange: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[54px] w-full rounded-2xl border border-white/50 bg-white/25 pr-4 pl-12 text-[15px] font-medium text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-sky-300 focus:bg-white/70 focus:ring-4 focus:ring-sky-400/25 disabled:opacity-60"
        {...props}
      />
    </div>
  )
}

function LoginGate({ onAuthenticated, onUnlocked }: { onAuthenticated: () => void; onUnlocked: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const successRef = useRef(false)

  const lock = useLottie(
    {
      animationData: lockAnim,
      autoplay: false,
      loop: false,
      onComplete: () => {
        if (successRef.current) onUnlocked()
      },
    },
    { width: 88, height: 88 },
  )

  useEffect(() => {
    lock.setSpeed(2)
    lock.goToAndStop(37, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const px = useMotionValue(50)
  const py = useMotionValue(38)
  const sx = useSpring(px, { stiffness: 120, damping: 20 })
  const sy = useSpring(py, { stiffness: 120, damping: 20 })
  const sheen = useMotionTemplate`radial-gradient(440px circle at ${sx}% ${sy}%, rgba(255,255,255,0.5), transparent 62%)`
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 100)
    py.set(((e.clientY - r.top) / r.height) * 100)
  }
  const onLeave = () => {
    px.set(50)
    py.set(38)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
      successRef.current = true
      setSuccess(true)
      onAuthenticated()
      lock.playSegments([37, 141], true)
    } catch {
      setError('Login fehlgeschlagen. E-Mail oder Passwort falsch.')
      setBusy(false)
      lock.goToAndStop(37, true)
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.55), transparent 65%)' }}
      />

      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 17 }}
        className="relative w-full max-w-[450px] overflow-hidden rounded-[32px] p-8 sm:p-10"
        style={GLASS}
      >
        <TopGloss />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60" style={{ background: sheen }} />

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-white/70"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            boxShadow: 'inset 0 1px 5px rgba(255,255,255,0.65), inset 0 -8px 16px -10px rgba(40,70,120,0.28), 0 12px 24px -14px rgba(30,64,110,0.32)',
          }}
        >
          <div className="h-[88px] w-[88px]">{lock.View}</div>
        </motion.div>

        <h1 className="mt-6 text-center text-[26px] font-bold tracking-tight text-slate-800">Orga-Login</h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">Nur fürs Sportfest-Team.</p>

        <form onSubmit={submit} className="mt-8 space-y-3.5">
          <Field icon={Mail} type="email" placeholder="E-Mail-Adresse" value={email} onChange={setEmail} autoComplete="email" disabled={success} />
          <Field icon={Lock} type="password" placeholder="Passwort" value={password} onChange={setPassword} autoComplete="current-password" disabled={success} />
          {error && <p className="px-1 text-sm font-semibold text-rose-500">{error}</p>}
          <motion.button
            type="submit"
            disabled={busy}
            whileHover={busy ? undefined : { y: -2 }}
            whileTap={busy ? undefined : { scale: 0.97 }}
            className="sheen mt-1 h-[54px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-[15px] font-semibold text-white shadow-[0_14px_30px_-10px_rgba(5,150,105,0.6),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-8px_16px_-10px_rgba(2,80,55,0.6)] transition-colors hover:from-emerald-500 hover:to-emerald-700 disabled:opacity-70"
          >
            {success ? 'Entsperrt…' : busy ? 'Anmelden…' : 'Anmelden'}
          </motion.button>
        </form>

        <Link to="/" className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Zurück zur Startseite
        </Link>
      </motion.div>
    </div>
  )
}

function LogoutAnimation({ onDone }: { onDone: () => void }) {
  const lock = useLottie({ animationData: lockAnim, autoplay: false, loop: false, onComplete: onDone }, { width: 150, height: 150 })

  useEffect(() => {
    lock.setSpeed(2)
    lock.goToAndStop(60, true)
    const t = window.setTimeout(() => lock.playSegments([60, 35], true), 150)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 17 }}
        className="relative w-[min(92vw,22rem)] overflow-hidden rounded-[32px] p-8 text-center"
        style={GLASS}
      >
        <TopGloss />
        <div className="mx-auto flex h-36 w-36 items-center justify-center">{lock.View}</div>
        <p className="mt-1 text-[17px] font-semibold text-slate-800">Abmelden…</p>
      </motion.div>
    </div>
  )
}

function AdminShell({
  email,
  teams,
  stations,
  scores,
  loading,
  reload,
  onLogout,
}: {
  email: string
  teams: Team[]
  stations: StationAdmin[]
  scores: Score[]
  loading: boolean
  reload: () => void
  onLogout: () => void
}) {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="relative mx-auto min-h-dvh max-w-5xl px-4 py-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Brand to="/admin" />
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-graphite-soft sm:inline">{email}</span>
          <Button size="sm" variant="ghost" onClick={onLogout}>
            Abmelden
          </Button>
        </div>
      </header>

      <nav className="mt-5 flex gap-1 overflow-x-auto rounded-full glass p-1.5 no-scrollbar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              'relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors',
              tab === id ? 'text-white' : 'text-graphite-soft hover:text-graphite',
            )}
          >
            {tab === id && <motion.span layoutId="tab-pill" className="absolute inset-0 -z-10 rounded-full bg-moss-600" transition={spring} />}
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      <main className="mt-5 pb-16">
        {loading ? (
          <div className="grid place-items-center py-20">
            <EmblemLoader />
          </div>
        ) : tab === 'overview' ? (
          <OverviewTab teams={teams} stations={stations} scores={scores} reload={reload} />
        ) : tab === 'teams' ? (
          <TeamsTab teams={teams} reload={reload} />
        ) : tab === 'stations' ? (
          <StationsTab stations={stations} reload={reload} />
        ) : (
          <AuditTab teams={teams} stations={stations} />
        )}
      </main>
    </div>
  )
}
