import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, ChevronRight, LogOut, RefreshCw, SearchX, WifiOff } from 'lucide-react'
import { getStationPublic, stationLogin } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useScoreSubmitter } from '@/lib/useScoreSubmitter'
import type { StationSession } from '@/lib/types'
import { Button, EmblemLoader, GlassCard, Spinner, TextInput } from '@/components/ui'
import { StationIcon } from '@/components/icons'
import { cx, fmt } from '@/lib/format'
import { spring } from '@/lib/motion'
import { LottieOnce } from '@/components/Lottie'
import checkGreen from '@/assets/lottie/check-green.json'

type Phase = 'loading' | 'notfound' | 'locked' | 'ready'
type StationInfo = { id: string; name: string; icon: string; beschreibung: string | null; einheit: string | null }

const sessKey = (token: string) => `sportfest_session_${token}`

export default function StationHelper() {
  const { token = '' } = useParams()
  const [phase, setPhase] = useState<Phase>('loading')
  const [info, setInfo] = useState<StationInfo | null>(null)
  const [session, setSession] = useState<StationSession | null>(null)
  const [pin, setPin] = useState('')
  const [helfer, setHelfer] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [values, setValues] = useState<Record<string, number>>({})
  const [editing, setEditing] = useState<string | null>(null)

  const doLogin = useCallback(
    async (tryPin: string, tryHelfer: string, fromStorage = false) => {
      setLoggingIn(true)
      setLoginError(null)
      try {
        const res = await stationLogin(token, tryPin)
        if (res.ok) {
          setSession(res)
          setPin(tryPin)
          setHelfer(tryHelfer)
          setValues(Object.fromEntries(res.teams.map((t) => [t.id, t.punkte ?? 0])))
          sessionStorage.setItem(sessKey(token), JSON.stringify({ pin: tryPin, helfer: tryHelfer }))
          setPhase('ready')
        } else if (!fromStorage) {
          setLoginError(res.error === 'wrong_pin' ? 'Falsche PIN.' : 'Station nicht gefunden.')
        } else {
          sessionStorage.removeItem(sessKey(token))
          setPhase('locked')
        }
      } catch {
        setLoginError('Keine Verbindung. Prüfe das WLAN und versuch es nochmal.')
      } finally {
        setLoggingIn(false)
      }
    },
    [token],
  )

  useEffect(() => {
    let active = true
    getStationPublic(token)
      .then((res) => {
        if (!active) return
        if (!res.ok || !res.station) {
          setPhase('notfound')
          return
        }
        setInfo(res.station)
        const saved = sessionStorage.getItem(sessKey(token))
        if (saved) {
          const { pin: p, helfer: h } = JSON.parse(saved)
          void doLogin(p, h ?? '', true)
        } else {
          setPhase('locked')
        }
      })
      .catch(() => active && setPhase('notfound'))
    return () => {
      active = false
    }
  }, [token, doLogin])

  const onConfirmed = useCallback((teamId: string, punkte: number) => {
    setValues((v) => ({ ...v, [teamId]: punkte }))
  }, [])

  const submitter = useScoreSubmitter({ token, pin, helfer: helfer || null, onConfirmed })

  useEffect(() => {
    if (!session) return
    const ch = supabase
      .channel(`station-${session.station.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores', filter: `station_id=eq.${session.station.id}` },
        (payload) => {
          const row = payload.new as { team_id: string; punkte: number }
          if (row?.team_id) setValues((v) => ({ ...v, [row.team_id]: row.punkte }))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [session])

  const logout = () => {
    sessionStorage.removeItem(sessKey(token))
    setSession(null)
    setPin('')
    setPhase('locked')
  }

  const editingTeam = useMemo(() => session?.teams.find((t) => t.id === editing) ?? null, [session, editing])

  if (phase === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center">
        <EmblemLoader />
      </div>
    )
  }

  if (phase === 'notfound') {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <GlassCard solid className="max-w-sm p-8 text-center">
          <SearchX className="mx-auto mb-3 h-10 w-10 text-graphite-soft" strokeWidth={1.6} />
          <h1 className="font-display text-xl font-bold">Station nicht gefunden</h1>
          <p className="mt-2 text-sm text-graphite-soft">
            Der Link oder QR-Code ist ungültig oder die Station ist deaktiviert. Frag die Orga.
          </p>
        </GlassCard>
      </div>
    )
  }

  if (phase === 'locked') {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <GlassCard solid className="w-[min(92vw,26rem)] p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-moss-500/10 text-moss-600 hairline">
                <StationIcon name={info?.icon} className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <h1 className="font-display text-2xl font-bold">{info?.name}</h1>
              {info?.beschreibung && <p className="mt-1 text-sm text-graphite-soft">{info.beschreibung}</p>}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void doLogin(pin, helfer)
              }}
              className="space-y-3"
            >
              <TextInput label="Dein Name (optional)" placeholder="z.B. Leon" value={helfer} onChange={(e) => setHelfer(e.target.value)} autoComplete="off" />
              <TextInput label="Stations-PIN" inputMode="numeric" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
              {loginError && <p className="text-sm font-semibold text-crimson-600">{loginError}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={loggingIn || !pin}>
                {loggingIn ? <Spinner className="h-5 w-5 border-white/30 border-t-white" /> : 'Station starten'}
              </Button>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  const station = session!.station
  const einheit = station.einheit ?? 'Punkte'

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-5">
      <header className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 bg-paper/70 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-moss-500/10 text-moss-600 hairline">
            <StationIcon name={station.icon} className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight">{station.name}</h1>
            <p className="text-xs text-graphite-soft">{helfer ? `Helfer: ${helfer}` : 'Punkte eintragen'}</p>
          </div>
        </div>
        <button onClick={logout} className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-graphite-soft hover:text-crimson-600">
          <LogOut className="h-4 w-4" /> Beenden
        </button>
      </header>

      <AnimatePresence>
        {(!submitter.online || submitter.pendingCount > 0 || submitter.pinError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cx(
              'mb-3 flex items-center gap-2 overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-semibold',
              submitter.pinError ? 'bg-crimson-500/12 text-crimson-600' : !submitter.online ? 'bg-brass-400/15 text-brass-500' : 'bg-moss-500/12 text-moss-700',
            )}
          >
            {submitter.pinError ? (
              <>
                <AlertTriangle className="h-4 w-4 shrink-0" /> PIN abgelehnt – bitte neu starten.
              </>
            ) : !submitter.online ? (
              <>
                <WifiOff className="h-4 w-4 shrink-0" /> Offline – {submitter.pendingCount} Eintrag(e) werden gesendet, sobald Netz da ist.
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 shrink-0 animate-spin" /> {submitter.pendingCount} Eintrag(e) werden synchronisiert…
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mb-3 text-sm text-graphite-soft">
        Tippe eine Klasse an, um ihr Ergebnis ({einheit}) einzutragen oder zu ändern.
      </p>

      <div className="grid gap-2">
        {session!.teams.map((t) => {
          const val = submitter.pending[t.id]?.punkte ?? values[t.id] ?? 0
          const st = submitter.status[t.id]
          const isPending = submitter.pending[t.id] !== undefined
          return (
            <motion.button
              key={t.id}
              layout
              whileTap={{ scale: 0.985 }}
              onClick={() => setEditing(t.id)}
              className="flex items-center gap-3 rounded-2xl glass px-4 py-3 text-left transition-colors hover:bg-white/80"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.farbe }} />
              <span className="flex-1 text-base font-bold">{t.name}</span>
              {isPending && (
                <span className="text-xs font-semibold text-moss-600">
                  {st === 'sending' ? 'sendet…' : st === 'queued' ? 'gepuffert' : st === 'error' ? 'Fehler' : ''}
                </span>
              )}
              <span className="font-display text-2xl font-bold tabular text-graphite">{fmt(val)}</span>
              <ChevronRight className="h-5 w-5 text-graphite-soft/40" />
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {editingTeam && (
          <ScoreEditor
            key={editingTeam.id}
            teamName={editingTeam.name}
            einheit={einheit}
            current={submitter.pending[editingTeam.id]?.punkte ?? values[editingTeam.id] ?? 0}
            onClose={() => setEditing(null)}
            onSave={(value) => {
              submitter.submit(editingTeam.id, value)
              setValues((v) => ({ ...v, [editingTeam.id]: value }))
              setEditing(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ScoreEditor({
  teamName,
  einheit,
  current,
  onClose,
  onSave,
}: {
  teamName: string
  einheit: string
  current: number
  onClose: () => void
  onSave: (value: number) => void
}) {
  const [raw, setRaw] = useState(String(current))
  const [saved, setSaved] = useState(false)
  const parsed = Number.parseFloat(raw.replace(',', '.'))
  const value = Number.isFinite(parsed) ? parsed : 0
  const bump = (d: number) => setRaw(String(Math.max(0, Math.round((value + d) * 100) / 100)))
  const save = () => {
    setSaved(true)
    window.setTimeout(() => onSave(value), 900)
  }

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={spring}
        className="glass-solid relative w-full rounded-t-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-[2rem]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-graphite/15 sm:hidden" />
        <h2 className="text-center font-display text-xl font-bold">{teamName}</h2>
        <p className="mb-4 text-center text-sm text-graphite-soft">Ergebnis in {einheit}</p>

        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-full rounded-2xl border border-graphite/12 bg-white py-5 text-center font-display text-5xl font-black tabular text-moss-700 outline-none focus:ring-4 focus:ring-moss-500/20"
        />

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[+1, +5, +10, -1].map((d) => (
            <button key={d} onClick={() => bump(d)} className="min-h-11 rounded-2xl bg-graphite/[0.05] py-3 font-bold text-graphite transition hover:bg-graphite/10">
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saved}>
            Abbrechen
          </Button>
          <Button className="flex-1" size="lg" onClick={save} disabled={saved}>
            <Check className="h-5 w-5" /> Speichern
          </Button>
        </div>

        {saved && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-t-[2rem] bg-white/95 sm:rounded-[2rem]">
            <div className="text-center">
              <LottieOnce data={checkGreen} className="mx-auto h-32 w-32" />
              <p className="-mt-2 font-display text-xl text-moss-700">Gespeichert!</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
