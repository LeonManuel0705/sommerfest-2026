import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CloudRain, KeyRound, ShieldCheck } from 'lucide-react'
import { fetchVolleyMatches, fetchVolleySchienen, volleyLeaderSetMatch, volleyLeaderSetTeams, volleyLeaderSetZeit, volleyLogin } from '@/lib/api'
import { computeFinalists, FINALS, VOLLEY_SCHIENEN, type VolleyMatch } from '@/lib/volley'
import { useEventSettingsState } from '@/lib/useSettings'
import { VolleyBoard, type VolleyMut } from '@/components/VolleyBoard'
import { Button, EmblemLoader, Spinner, TextInput } from '@/components/ui'

export default function VolleyLeiter() {
  const { settings, loaded } = useEventSettingsState()
  const { token = '' } = useParams()
  const [pin, setPin] = useState<string>('')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [matches, setMatches] = useState<VolleyMatch[] | null>(null)
  const [zeiten, setZeiten] = useState<Record<number, string>>({})

  const load = useCallback(() => {
    fetchVolleyMatches().then(setMatches).catch(() => setMatches((m) => m ?? []))
    fetchVolleySchienen().then(setZeiten).catch(() => {})
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem(`vpin:${token}`)
    if (!saved) {
      setChecking(false)
      return
    }
    volleyLogin(token, saved)
      .then((r) => {
        if (r.ok) {
          setPin(saved)
          setAuthed(true)
        } else {
          sessionStorage.removeItem(`vpin:${token}`)
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [token])

  useEffect(() => {
    if (!authed) return
    load()
    const id = window.setInterval(load, 5000)
    return () => window.clearInterval(id)
  }, [authed, load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const r = await volleyLogin(token, pin)
      if (r.ok) {
        sessionStorage.setItem(`vpin:${token}`, pin)
        setAuthed(true)
      } else {
        setError(r.error === 'wrong_pin' ? 'Falsche PIN.' : 'Zugang nicht gefunden.')
      }
    } catch {
      setError('Verbindungsfehler.')
    }
  }

  const mut: VolleyMut = {
    setScore: (m, a, b, status) => volleyLeaderSetMatch(token, pin, m.id, a, b, status).then(() => undefined),
    setTeams: (m, a, b) => volleyLeaderSetTeams(token, pin, m.id, a, b).then(() => undefined),
    fillFinals: async (ms) => {
      for (const s of VOLLEY_SCHIENEN) {
        const fin = computeFinalists(s.schiene, ms)
        for (let i = 0; i < FINALS.length; i++) {
          const row = ms.find((m) => m.phase === 'final' && m.schiene === s.schiene && m.platz === FINALS[i].platz)
          if (!row || !fin[i].a || !fin[i].b) continue
          await volleyLeaderSetTeams(token, pin, row.id, fin[i].a, fin[i].b)
        }
      }
    },
    setZeit: (schiene, zeit) => volleyLeaderSetZeit(token, pin, schiene, zeit).then(() => undefined),
  }

  if (checking || !loaded) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper">
        <EmblemLoader />
      </div>
    )
  }

  if (!settings.volleyball_aktiv) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper p-6">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-card ring-1 ring-black/5"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-crimson-500/10 text-crimson-500">
            <CloudRain className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-graphite">Turnier fällt aus</h1>
          <p className="mt-2 text-sm leading-relaxed text-graphite-soft">
            Das Volleyball-Turnier fällt {settings.regen_modus ? 'wegen des Wetters ' : ''}aus — hier gibt es nichts einzutragen.
            {settings.lehrer_spiel_aktiv && ' Das Spiel Lehrkräfte vs. Jahrgang 11 (12:50–13:20 Uhr, Turnhalle) findet statt.'}
          </p>
          <p className="mt-2 text-xs text-graphite-soft">Sollte die Orga das Turnier wieder aktivieren, funktioniert dein Zugang hier sofort wieder.</p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-moss-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_-12px_rgba(0,128,55,0.7)] transition hover:bg-moss-700"
          >
            Zur Startseite
          </Link>
        </motion.div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper p-6">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="w-full max-w-sm rounded-[28px] bg-white p-7 text-center shadow-card ring-1 ring-black/5"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-moss-600/10 text-moss-700">
            <KeyRound className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-graphite">Turnierleitung</h1>
          <p className="mt-1 text-sm text-graphite-soft">Volleyball-Turnier · Ergebnisse eintragen</p>
          <div className="mt-6 text-left">
            <TextInput
              label="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              autoFocus
              placeholder="••••"
            />
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-crimson-500">{error}</p>}
          <Button type="submit" className="mt-5 w-full" disabled={pin.trim() === ''}>
            <ShieldCheck className="h-4 w-4" /> Anmelden
          </Button>
        </motion.form>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b border-graphite/[0.06] bg-white/85 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-moss-600/10 text-moss-700">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <div className="font-semibold text-graphite">Turnierleitung</div>
            <div className="text-xs text-graphite-soft">Volleyball-Turnier</div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        {matches === null ? (
          <div className="grid place-items-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-graphite-soft shadow-card ring-1 ring-black/5">
            Der Spielplan wurde von der Orga noch nicht erstellt.
          </div>
        ) : (
          <VolleyBoard matches={matches} reload={load} mut={mut} zeiten={zeiten} />
        )}
      </main>
    </div>
  )
}
