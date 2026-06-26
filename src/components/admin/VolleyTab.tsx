import { useCallback, useEffect, useState } from 'react'
import { RotateCcw, Wand2 } from 'lucide-react'
import { fetchVolleyMatches, generateVolleySchedule, resetVolley, setVolleyMatch } from '@/lib/api'
import { VOLLEY_SCHIENEN, type VolleyMatch } from '@/lib/volley'
import { Button, EmblemLoader } from '@/components/ui'
import { cx } from '@/lib/format'

const STATUS: { id: VolleyMatch['status']; label: string }[] = [
  { id: 'geplant', label: 'Geplant' },
  { id: 'live', label: 'Live' },
  { id: 'fertig', label: 'Fertig' },
]

export function VolleyTab() {
  const [matches, setMatches] = useState<VolleyMatch[] | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetchVolleyMatches().then(setMatches).catch(() => setMatches([]))
  }, [])
  useEffect(load, [load])

  const patch = (id: string, fields: Partial<VolleyMatch>) => {
    setMatches((ms) => (ms ?? []).map((m) => (m.id === id ? { ...m, ...fields } : m)))
  }

  const commitScore = async (m: VolleyMatch, side: 'a' | 'b', raw: string) => {
    const v = raw === '' ? null : Number.parseInt(raw, 10)
    const value = v == null || Number.isNaN(v) ? null : v
    const field = side === 'a' ? 'score_a' : 'score_b'
    if (m[field] === value) return
    patch(m.id, { [field]: value })
    try {
      await setVolleyMatch(m.id, { [field]: value })
    } catch {
      load()
    }
  }

  const setStatus = async (m: VolleyMatch, status: VolleyMatch['status']) => {
    patch(m.id, { status })
    try {
      await setVolleyMatch(m.id, { status })
    } catch {
      load()
    }
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

  if (matches.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-card ring-1 ring-black/5">
        <p className="text-graphite-soft">Noch kein Spielplan. Erzeuge das Gruppen-Turnier (jede Klasse spielt einmal gegen jede in ihrer Gruppe).</p>
        <Button className="mt-5" onClick={generate} disabled={busy}>
          <Wand2 className="h-4 w-4" /> Spielplan erzeugen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-graphite-soft">Trage Ergebnisse ein und stelle laufende Spiele auf „Live".</p>
        <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
          <RotateCcw className="h-4 w-4" /> Zurücksetzen
        </Button>
      </div>

      {VOLLEY_SCHIENEN.map((s) => (
        <div key={s.schiene}>
          <h3 className="font-display text-2xl text-graphite">{s.label}</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {Object.keys(s.gruppen).map((g) => (
              <div key={g} className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5">
                <div className="label-mono text-[10px] text-graphite-soft">Gruppe {g}</div>
                <div className="mt-2 space-y-1.5">
                  {matches
                    .filter((m) => m.schiene === s.schiene && m.gruppe === g)
                    .map((m) => (
                      <div key={m.id} className={cx('flex items-center gap-2 rounded-xl px-2 py-1.5', m.status === 'live' ? 'bg-moss-600/10' : 'bg-paper')}>
                        <span className="flex-1 text-right text-sm font-bold text-graphite">{m.team_a}</span>
                        <input
                          inputMode="numeric"
                          defaultValue={m.score_a ?? ''}
                          key={`a${m.id}:${m.score_a ?? ''}`}
                          onBlur={(e) => commitScore(m, 'a', e.target.value)}
                          className="w-10 rounded-lg bg-white px-1 py-1 text-center tabular outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-moss-400"
                        />
                        <span className="text-graphite-soft">:</span>
                        <input
                          inputMode="numeric"
                          defaultValue={m.score_b ?? ''}
                          key={`b${m.id}:${m.score_b ?? ''}`}
                          onBlur={(e) => commitScore(m, 'b', e.target.value)}
                          className="w-10 rounded-lg bg-white px-1 py-1 text-center tabular outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-moss-400"
                        />
                        <span className="flex-1 text-sm font-bold text-graphite">{m.team_b}</span>
                        <div className="flex shrink-0 gap-0.5">
                          {STATUS.map((st) => (
                            <button
                              key={st.id}
                              onClick={() => setStatus(m, st.id)}
                              className={cx(
                                'rounded-md px-1.5 py-1 text-[10px] font-bold transition',
                                m.status === st.id
                                  ? st.id === 'live'
                                    ? 'bg-moss-600 text-white'
                                    : st.id === 'fertig'
                                      ? 'bg-graphite text-white'
                                      : 'bg-graphite/15 text-graphite'
                                  : 'text-graphite-soft hover:bg-graphite/10',
                              )}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
