import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { KeyRound, RotateCcw, Wand2 } from 'lucide-react'
import { fetchVolleyMatches, fetchVolleyStation, fillVolleyFinals, generateVolleySchedule, resetVolley, setStationPin, setVolleyMatch } from '@/lib/api'
import type { VolleyMatch } from '@/lib/volley'
import { VolleyBoard, type VolleyMut } from '@/components/VolleyBoard'
import { Button, EmblemLoader } from '@/components/ui'

type Station = { id: string; token: string; hasPin: boolean }

export function VolleyTab() {
  const [matches, setMatches] = useState<VolleyMatch[] | null>(null)
  const [station, setStation] = useState<Station | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetchVolleyMatches().then(setMatches).catch(() => setMatches([]))
    fetchVolleyStation().then(setStation).catch(() => setStation(null))
  }, [])
  useEffect(load, [load])

  const mut: VolleyMut = {
    setScore: (m, a, b, status) => setVolleyMatch(m.id, { score_a: a, score_b: b, status }),
    setTeams: (m, a, b) => setVolleyMatch(m.id, { team_a: a, team_b: b }),
    fillFinals: (ms) => fillVolleyFinals(ms),
  }

  const generate = async () => {
    setBusy(true)
    try {
      await generateVolleySchedule()
      load()
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (!window.confirm('Wirklich den gesamten Volleyball-Spielplan löschen?')) return
    setBusy(true)
    try {
      await resetVolley()
      load()
    } finally {
      setBusy(false)
    }
  }

  if (matches === null) {
    return (
      <div className="grid place-items-center py-16">
        <EmblemLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <LeaderPanel station={station} onSaved={load} />

      {matches.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-card ring-1 ring-black/5">
          <p className="text-graphite-soft">Noch kein Spielplan. Erzeuge das Turnier (Gruppenphase je Schiene + Finalrunde um Platz 1/3/5).</p>
          <Button className="mt-5" onClick={generate} disabled={busy}>
            <Wand2 className="h-4 w-4" /> Spielplan erzeugen
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-graphite-soft">Ergebnisse eintragen, Spiele auf „Live" stellen, Finals besetzen.</p>
            <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
              <RotateCcw className="h-4 w-4" /> Zurücksetzen
            </Button>
          </div>
          <VolleyBoard matches={matches} reload={load} mut={mut} />
        </>
      )}
    </div>
  )
}

function LeaderPanel({ station, onSaved }: { station: Station | null; onSaved: () => void }) {
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)
  const url = station ? `${window.location.origin}/v/${station.token}` : ''

  const save = async (value: string | null) => {
    if (!station) return
    setSaving(true)
    try {
      await setStationPin(station.id, value)
      setPin('')
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  if (!station) {
    return (
      <div className="rounded-3xl bg-white p-5 text-sm text-graphite-soft shadow-card ring-1 ring-black/5">
        Station „Volleyball-Turnier" nicht gefunden — bitte die aktuelle <b>setup.sql</b> in Supabase ausführen.
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-2 text-sm font-bold text-graphite">
        <KeyRound className="h-4 w-4 text-moss-600" /> Zugang für die Turnierleitung
      </div>
      <p className="mt-1 text-sm text-graphite-soft">
        Mit QR-Code + PIN trägt die Leitung Ergebnisse selbst ein — ohne Admin-Login und nur fürs Volleyball-Turnier.
      </p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid h-32 w-32 shrink-0 place-items-center rounded-2xl bg-white p-2 ring-1 ring-black/10">
          <QRCodeSVG value={url} size={108} level="M" fgColor="#101828" bgColor="#ffffff" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="break-all text-sm font-semibold text-graphite">{url.replace(/^https?:\/\//, '')}</div>
          <div className="mt-1 text-xs text-graphite-soft">
            Status:{' '}
            {station.hasPin ? (
              <span className="font-semibold text-moss-700">PIN gesetzt ✓</span>
            ) : (
              <span className="font-semibold text-crimson-500">Noch keine PIN</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              placeholder="Neue PIN"
              className="w-32 rounded-xl border border-graphite/12 bg-white px-3 py-2 text-base outline-none focus:border-moss-500"
            />
            <Button size="sm" onClick={() => save(pin.trim() || null)} disabled={saving || pin.trim() === ''}>
              {station.hasPin ? 'PIN ändern' : 'PIN setzen'}
            </Button>
            {station.hasPin && (
              <Button size="sm" variant="ghost" onClick={() => save(null)} disabled={saving}>
                Entfernen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
