import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AnimatePresence, motion } from 'framer-motion'
import { useLottie } from 'lottie-react'
import { Activity, Gauge, LayoutGrid, ScrollText, Target, Users, Volleyball } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchScores, fetchStationsAdmin, fetchTeams, signOut, takeAdminPrefetch } from '@/lib/api'
import type { Score, StationAdmin, Team } from '@/lib/types'
import { Brand } from '@/components/Brand'
import { Button, EmblemLoader } from '@/components/ui'
import { TeamsTab } from '@/components/admin/TeamsTab'
import { StationsTab } from '@/components/admin/StationsTab'
import { OverviewTab } from '@/components/admin/OverviewTab'
import { StatusTab } from '@/components/admin/StatusTab'
import { AuditTab } from '@/components/admin/AuditTab'
import { VolleyTab } from '@/components/admin/VolleyTab'
import { SystemTab } from '@/components/admin/SystemTab'
import { cx } from '@/lib/format'
import { spring } from '@/lib/motion'
import lockAnim from '@/assets/lottie/lock-green-tick.json'
import { GLASS, TopGloss } from '@/components/site/OrgaLogin'

function AuthBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: 'url(/hero-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/65 to-paper" />
    </div>
  )
}

function AdminWatermark() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 grid place-items-center overflow-hidden">
      <img src="/ehg-logo.png" alt="" className="w-[min(82vw,700px)] opacity-[0.14] grayscale" />
    </div>
  )
}

type Tab = 'overview' | 'status' | 'teams' | 'stations' | 'volley' | 'audit' | 'system'
const TABS: Array<{ id: Tab; label: string; Icon: LucideIcon }> = [
  { id: 'overview', label: 'Übersicht', Icon: LayoutGrid },
  { id: 'status', label: 'Status', Icon: Gauge },
  { id: 'teams', label: 'Klassen', Icon: Users },
  { id: 'stations', label: 'Stationen', Icon: Target },
  { id: 'volley', label: 'Volleyball', Icon: Volleyball },
  { id: 'audit', label: 'Protokoll', Icon: ScrollText },
  { id: 'system', label: 'System', Icon: Activity },
]

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()

  const [teams, setTeams] = useState<Team[]>([])
  const [stations, setStations] = useState<StationAdmin[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const loadData = useCallback(async () => {
    setDataLoading(true)
    const prefetch = takeAdminPrefetch()
    const [t, s, sc] = await (prefetch ?? Promise.all([fetchTeams(), fetchStationsAdmin(), fetchScores()]))
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
      if (data.session) loadData()
      setAuthLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [loadData])

  useEffect(() => {
    if (!session) return
    const ch = supabase
      .channel('admin-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, reloadScores)
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [session, reloadScores])

  if (authLoading)
    return (
      <div className="grid min-h-dvh place-items-center">
        <EmblemLoader />
      </div>
    )

  if (!session && !loggingOut) return <Navigate to="/?login=1" replace />

  return (
    <div className="relative min-h-dvh bg-paper">
      {loggingOut ? <AuthBg /> : <AdminWatermark />}
      <AnimatePresence mode="wait">
        {loggingOut ? (
          <motion.div key="logout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LogoutAnimation
              onDone={async () => {
                await signOut()
                navigate('/', { replace: true })
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="shell"
            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
            className="relative z-10"
          >
            <AdminShell
              email={session?.user.email ?? ''}
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
              'relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-3 text-sm font-bold transition-colors',
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
        ) : tab === 'status' ? (
          <StatusTab teams={teams} stations={stations} scores={scores} />
        ) : tab === 'teams' ? (
          <TeamsTab teams={teams} reload={reload} />
        ) : tab === 'stations' ? (
          <StationsTab stations={stations} reload={reload} />
        ) : tab === 'volley' ? (
          <VolleyTab />
        ) : tab === 'audit' ? (
          <AuditTab teams={teams} stations={stations} />
        ) : (
          <SystemTab />
        )}
      </main>
    </div>
  )
}
