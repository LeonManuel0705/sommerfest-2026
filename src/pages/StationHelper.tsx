import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, ChevronRight, LogOut, RefreshCw, SearchX, WifiOff } from 'lucide-react'
import { getStationPublic, stationLogin, stationSetPin } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useScoreSubmitter } from '@/lib/useScoreSubmitter'
import type { StationSession } from '@/lib/types'
import { Button, EmblemLoader, GlassCard, Spinner, TextInput } from '@/components/ui'
import { StationIcon } from '@/components/icons'
import { cx, fmt } from '@/lib/format'
import { spring } from '@/lib/motion'
import { useLottie } from 'lottie-react'
import { LottieOnce } from '@/components/Lottie'
import checkGreen from '@/assets/lottie/check-green.json'
import lockAnim from '@/assets/lottie/lock-green-tick.json'

type Phase = 'loading' | 'notfound' | 'locked' | 'ready'
type StationInfo = { id: string; name: string; icon: string; beschreibung: string | null; einheit: string | null; has_pin: boolean }

const sessKey = (token: string) => `sportfest_session_${token}`
const IDLE_LOGOUT_MS = 3 * 60 * 1000

export default function StationHelper() {
  const { token = '' } = useParams()
  const [phase, setPhase] = useState<Phase>('loading')
  const [info, setInfo] = useState<StationInfo | null>(null)
  const [session, setSession] = useState<StationSession | null>(null)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [startPin, setStartPin] = useState('')
  const [changeMode, setChangeMode] = useState(false)
  const [helfer, setHelfer] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [values, setValues] = useState<Record<string, number>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [justLoggedOut, setJustLoggedOut] = useState(false)

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
          if (fromStorage) setPhase('ready')
          else setUnlocking(true)
        } else if (!fromStorage) {
          setLoginError(
            res.error === 'wrong_pin'
              ? 'Falsche PIN.'
              : res.error === 'locked'
                ? 'Zu viele Fehlversuche — die Station ist kurz gesperrt. Wartet eine Minute und versucht es nochmal.'
                : 'Station nicht gefunden.',
          )
        } else {
          sessionStorage.removeItem(sessKey(token))
          setPhase('locked')
        }
      } catch (e) {
        setLoginError(e instanceof Error && e.message ? `Fehler: ${e.message}` : 'Keine Verbindung. Prüfe das WLAN und versuch es nochmal.')
      } finally {
        setLoggingIn(false)
      }
    },
    [token],
  )

  const doSetPin = useCallback(
    async (tryStartPin: string, newPin: string, tryHelfer: string) => {
      setLoginError(null)
      setLoggingIn(true)
      try {
        const res = await stationSetPin(token, tryStartPin, newPin)
        if (!res.ok) {
          setLoginError(
            res.error === 'wrong_start_pin'
              ? 'Start-PIN falsch. Sie steht auf eurem Stations-Zettel vom Orga-Team.'
              : res.error === 'locked'
                ? 'Zu viele Fehlversuche — die Station ist kurz gesperrt. Wartet eine Minute und versucht es nochmal.'
                : res.error === 'too_short'
                  ? 'Die neue PIN braucht mindestens 4 Zeichen.'
                  : 'PIN konnte nicht gesetzt werden.',
          )
          setLoggingIn(false)
          return
        }
      } catch (e) {
        setLoginError(e instanceof Error && e.message ? `Fehler: ${e.message}` : 'Keine Verbindung. Prüfe das WLAN und versuch es nochmal.')
        setLoggingIn(false)
        return
      }
      setChangeMode(false)
      setStartPin('')
      setInfo((i) => (i ? { ...i, has_pin: true } : i))
      await doLogin(newPin, tryHelfer)
    },
    [token, doLogin],
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

  const logout = useCallback(() => {
    sessionStorage.removeItem(sessKey(token))
    setSession(null)
    setPin('')
    setUnlocking(false)
    setJustLoggedOut(true)
    setPhase('locked')
  }, [token])

  useEffect(() => {
    if (!session || unlocking) return
    const onVisibility = () => {
      if (document.hidden) logout()
    }
    let timer = window.setTimeout(logout, IDLE_LOGOUT_MS)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(logout, IDLE_LOGOUT_MS)
    }
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [session, unlocking, logout])

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

  if (phase === 'locked' || !session) {
    return (
      <LockCard
        info={info}
        helfer={helfer}
        setHelfer={setHelfer}
        pin={pin}
        setPin={setPin}
        pinConfirm={pinConfirm}
        setPinConfirm={setPinConfirm}
        startPin={startPin}
        setStartPin={setStartPin}
        changeMode={changeMode}
        onToggleChangeMode={(v) => {
          setChangeMode(v)
          setLoginError(null)
          setPin('')
          setPinConfirm('')
          setStartPin('')
        }}
        loginError={loginError}
        loggingIn={loggingIn}
        unlocking={unlocking}
        justLoggedOut={justLoggedOut}
        onSubmitLogin={(e) => {
          e.preventDefault()
          if (helfer.trim() && pin) void doLogin(pin, helfer)
        }}
        onSubmitSetup={(e) => {
          e.preventDefault()
          if (helfer.trim() && startPin.trim() && pin.trim().length >= 4 && pin === pinConfirm) void doSetPin(startPin.trim(), pin.trim(), helfer)
        }}
        onUnlocked={() => {
          setUnlocking(false)
          setJustLoggedOut(false)
          setPhase('ready')
        }}
      />
    )
  }

  const station = session!.station
  const einheit = station.einheit ?? 'Punkte'

  return (
    <motion.div
      className="mx-auto min-h-dvh max-w-2xl px-4 py-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
    >
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
    </motion.div>
  )
}

function LockCard({
  info,
  helfer,
  setHelfer,
  pin,
  setPin,
  pinConfirm,
  setPinConfirm,
  startPin,
  setStartPin,
  changeMode,
  onToggleChangeMode,
  loginError,
  loggingIn,
  unlocking,
  justLoggedOut,
  onSubmitLogin,
  onSubmitSetup,
  onUnlocked,
}: {
  info: StationInfo | null
  helfer: string
  setHelfer: (v: string) => void
  pin: string
  setPin: (v: string) => void
  pinConfirm: string
  setPinConfirm: (v: string) => void
  startPin: string
  setStartPin: (v: string) => void
  changeMode: boolean
  onToggleChangeMode: (v: boolean) => void
  loginError: string | null
  loggingIn: boolean
  unlocking: boolean
  justLoggedOut: boolean
  onSubmitLogin: (e: FormEvent) => void
  onSubmitSetup: (e: FormEvent) => void
  onUnlocked: () => void
}) {
  const lockData = useMemo(() => JSON.parse(JSON.stringify(lockAnim)) as object, [])
  const segRef = useRef<'rest' | 'close' | 'unlock'>('rest')
  const lock = useLottie(
    {
      animationData: lockData,
      autoplay: false,
      loop: false,
      onComplete: () => {
        if (segRef.current === 'unlock') onUnlocked()
      },
    },
    { width: 96, height: 96 },
  )

  useEffect(() => {
    if (justLoggedOut) {
      segRef.current = 'close'
      lock.setSpeed(1.9)
      lock.goToAndStop(60, true)
      const t = window.setTimeout(() => lock.playSegments([60, 37], true), 200)
      return () => window.clearTimeout(t)
    }
    segRef.current = 'rest'
    lock.goToAndStop(37, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!unlocking) return
    segRef.current = 'unlock'
    lock.setSpeed(1.6)
    lock.playSegments([37, 141], true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocking])

  const needsSetup = info?.has_pin === false || changeMode
  const autoFocusPin = !justLoggedOut && typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <GlassCard solid className="w-[min(92vw,26rem)] p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-1 grid h-24 w-24 place-items-center">{lock.View}</div>
            <h1 className="font-display text-2xl font-bold">{info?.name}</h1>
            {info?.beschreibung && <p className="mt-1 text-sm text-graphite-soft">{info.beschreibung}</p>}
          </div>
          {unlocking ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 text-center text-sm font-semibold text-moss-600">
              Entsperrt …
            </motion.p>
          ) : needsSetup ? (
            <form onSubmit={onSubmitSetup} className="space-y-3">
              <p className="rounded-2xl bg-brass-400/10 px-4 py-2.5 text-sm text-brass-500">
                {changeMode ? (
                  <>Neue Stations-PIN festlegen — dafür braucht ihr die <b>Start-PIN</b> von eurem Stations-Zettel.</>
                ) : (
                  <>Diese Station hat noch keine PIN. Legt jetzt eine fest — dafür braucht ihr die <b>Start-PIN</b> von eurem Stations-Zettel (kommt vom Orga-Team).</>
                )}
              </p>
              <TextInput label="Dein Name" placeholder="z.B. Leon" value={helfer} onChange={(e) => setHelfer(e.target.value)} autoComplete="off" />
              <TextInput
                label="Start-PIN (vom Orga-Team)"
                inputMode="numeric"
                placeholder="••••••"
                value={startPin}
                onChange={(e) => setStartPin(e.target.value)}
                autoFocus={autoFocusPin}
              />
              <TextInput label="Neue Stations-PIN (min. 4 Zeichen)" inputMode="numeric" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} />
              <TextInput label="PIN wiederholen" inputMode="numeric" placeholder="••••" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)} />
              {pin && pinConfirm && pin !== pinConfirm && <p className="text-sm font-semibold text-crimson-600">Die PINs stimmen nicht überein.</p>}
              {loginError && <p className="text-sm font-semibold text-crimson-600">{loginError}</p>}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loggingIn || !helfer.trim() || !startPin.trim() || pin.trim().length < 4 || pin !== pinConfirm}
              >
                {loggingIn ? <Spinner className="h-5 w-5 border-white/30 border-t-white" /> : 'PIN festlegen & starten'}
              </Button>
              {changeMode && (
                <button
                  type="button"
                  onClick={() => onToggleChangeMode(false)}
                  className="w-full py-1 text-center text-sm font-semibold text-graphite-soft transition hover:text-graphite"
                >
                  Zurück zum Login
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={onSubmitLogin} className="space-y-3">
              <TextInput label="Dein Name" placeholder="z.B. Leon" value={helfer} onChange={(e) => setHelfer(e.target.value)} autoComplete="off" />
              <TextInput label="Stations-PIN" inputMode="numeric" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus={autoFocusPin} />
              {loginError && <p className="text-sm font-semibold text-crimson-600">{loginError}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={loggingIn || !helfer.trim() || !pin}>
                {loggingIn ? <Spinner className="h-5 w-5 border-white/30 border-t-white" /> : 'Station starten'}
              </Button>
              <button
                type="button"
                onClick={() => onToggleChangeMode(true)}
                className="w-full py-1 text-center text-sm font-semibold text-graphite-soft transition hover:text-graphite"
              >
                PIN vergessen? Mit Start-PIN neu festlegen
              </button>
            </form>
          )}
        </GlassCard>
      </motion.div>
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
  const [kb, setKb] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setKb(Math.max(0, window.innerHeight - vv.height))
    onResize()
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])
  const parsed = Number.parseFloat(raw.replace(',', '.'))
  const valid = Number.isFinite(parsed)
  const value = valid ? parsed : 0
  const bump = (d: number) => setRaw(String(Math.max(0, Math.round((value + d) * 100) / 100)))
  const save = () => {
    if (!valid) return
    setSaved(true)
    window.setTimeout(() => onSave(value), 900)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center"
      style={{ paddingBottom: kb || undefined }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
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
          <Button className="flex-1" size="lg" onClick={save} disabled={saved || !valid}>
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
