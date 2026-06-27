import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Trophy, Wand2 } from 'lucide-react'
import { computeStandings, FINALS, VOLLEY_SCHIENEN, type VolleyMatch } from '@/lib/volley'
import { cx } from '@/lib/format'

const STATUS: { id: VolleyMatch['status']; label: string }[] = [
  { id: 'geplant', label: 'Geplant' },
  { id: 'live', label: 'Live' },
  { id: 'fertig', label: 'Fertig' },
]

export type VolleyMut = {
  setScore: (m: VolleyMatch, scoreA: number | null, scoreB: number | null, status: VolleyMatch['status']) => Promise<void>
  setTeams: (m: VolleyMatch, a: string, b: string) => Promise<void>
  fillFinals: (matches: VolleyMatch[]) => Promise<void>
  setZeit: (schiene: number, zeit: string) => Promise<void>
}

export function VolleyBoard({ matches, reload, mut, zeiten }: { matches: VolleyMatch[]; reload: () => void; mut: VolleyMut; zeiten: Record<number, string> }) {
  const [local, setLocal] = useState<VolleyMatch[]>(matches)
  const [localZeit, setLocalZeit] = useState<Record<number, string>>(zeiten)
  const [busy, setBusy] = useState(false)
  useEffect(() => setLocal(matches), [matches])
  useEffect(() => setLocalZeit(zeiten), [zeiten])

  const commitZeit = async (schiene: number, raw: string) => {
    const value = raw.trim()
    if (!value || value === (localZeit[schiene] ?? '')) return
    setLocalZeit((z) => ({ ...z, [schiene]: value }))
    try {
      await mut.setZeit(schiene, value)
    } catch {
      reload()
    }
  }

  const patch = (id: string, fields: Partial<VolleyMatch>) => setLocal((ms) => ms.map((m) => (m.id === id ? { ...m, ...fields } : m)))

  const commitScore = async (m: VolleyMatch, side: 'a' | 'b', raw: string) => {
    const parsed = raw.trim() === '' ? null : Number.parseInt(raw, 10)
    const value = parsed == null || Number.isNaN(parsed) ? null : parsed
    if (m[side === 'a' ? 'score_a' : 'score_b'] === value) return
    const scoreA = side === 'a' ? value : m.score_a
    const scoreB = side === 'b' ? value : m.score_b
    patch(m.id, { score_a: scoreA, score_b: scoreB })
    try {
      await mut.setScore(m, scoreA, scoreB, m.status)
    } catch {
      reload()
    }
  }

  const setStatus = async (m: VolleyMatch, status: VolleyMatch['status']) => {
    patch(m.id, { status })
    try {
      await mut.setScore(m, m.score_a, m.score_b, status)
    } catch {
      reload()
    }
  }

  const setTeam = async (m: VolleyMatch, side: 'a' | 'b', value: string) => {
    const teamA = side === 'a' ? value : m.team_a
    const teamB = side === 'b' ? value : m.team_b
    patch(m.id, { team_a: teamA, team_b: teamB })
    try {
      await mut.setTeams(m, teamA, teamB)
    } catch {
      reload()
    }
  }

  const fill = async () => {
    setBusy(true)
    try {
      await mut.fillFinals(local)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <button
          onClick={fill}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-moss-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(0,128,55,0.7)] transition hover:bg-moss-700 disabled:opacity-50"
        >
          <Wand2 className="h-4 w-4" /> Finals aus Tabelle besetzen
        </button>
      </div>

      {VOLLEY_SCHIENEN.map((s) => {
        const klassen = [...s.gruppen.A, ...s.gruppen.B]
        const finals = local.filter((m) => m.phase === 'final' && m.schiene === s.schiene)
        return (
          <div key={s.schiene}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-2xl text-graphite">{s.label}</h3>
              <label className="flex items-center gap-2 text-sm text-graphite-soft">
                <Clock className="h-4 w-4 text-moss-600" />
                <input
                  defaultValue={localZeit[s.schiene] ?? s.zeit}
                  key={`z${s.schiene}:${localZeit[s.schiene] ?? s.zeit}`}
                  onBlur={(e) => commitZeit(s.schiene, e.target.value)}
                  aria-label={`Spielzeit ${s.label}`}
                  className="w-44 rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-graphite outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-moss-400"
                />
              </label>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {Object.entries(s.gruppen).map(([g, teams]) => {
                const gm = local.filter((m) => m.phase === 'gruppe' && m.schiene === s.schiene && m.gruppe === g)
                const table = computeStandings(teams, gm)
                return (
                  <div key={g} className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5">
                    <div className="label-mono text-[10px] text-graphite-soft">Gruppe {g}</div>
                    <div className="mt-2 space-y-1">
                      {table.map((r, i) => (
                        <div key={r.team} className="flex items-center gap-2 text-sm">
                          <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold', i === 0 ? 'bg-moss-600 text-white' : 'bg-paper text-graphite-soft')}>{i + 1}</span>
                          <span className="flex-1 font-bold text-graphite">{r.team}</span>
                          <span className="tabular text-graphite-soft">{r.siege} S · {r.diff > 0 ? `+${r.diff}` : r.diff}</span>
                          <span className="w-8 text-right font-bold tabular text-graphite">{r.punkte}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-1.5 border-t border-graphite/[0.06] pt-3">
                      {gm.map((m) => (
                        <MatchRow key={m.id} m={m} onScore={commitScore} onStatus={setStatus} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 rounded-3xl bg-gradient-to-br from-brass-300/15 to-white p-4 shadow-card ring-1 ring-brass-400/20">
              <div className="flex items-center gap-2 text-sm font-bold text-graphite">
                <Trophy className="h-4 w-4 text-brass-500" /> Finalrunde
              </div>
              <div className="mt-3 space-y-1.5">
                {FINALS.map((f) => {
                  const m = finals.find((x) => x.platz === f.platz)
                  if (!m) return null
                  return <MatchRow key={m.id} m={m} label={`${f.titel} · ${f.sub}`} klassen={klassen} onScore={commitScore} onStatus={setStatus} onTeam={setTeam} />
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MatchRow({
  m,
  label,
  klassen,
  onScore,
  onStatus,
  onTeam,
}: {
  m: VolleyMatch
  label?: string
  klassen?: string[]
  onScore: (m: VolleyMatch, side: 'a' | 'b', raw: string) => void
  onStatus: (m: VolleyMatch, status: VolleyMatch['status']) => void
  onTeam?: (m: VolleyMatch, side: 'a' | 'b', value: string) => void
}) {
  return (
    <motion.div layout className={cx('rounded-xl px-2 py-1.5', m.status === 'live' ? 'bg-moss-600/10' : 'bg-paper')}>
      {label && <div className="mb-1 label-mono text-[9px] text-brass-500">{label}</div>}
      <div className="flex w-full items-center gap-2">
        <TeamCell m={m} side="a" klassen={klassen} onTeam={onTeam} />
        <input
          inputMode="numeric"
          defaultValue={m.score_a ?? ''}
          key={`a${m.id}:${m.score_a ?? ''}`}
          onBlur={(e) => onScore(m, 'a', e.target.value)}
          className="w-12 rounded-lg bg-white px-1 py-2 text-center text-base tabular outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-moss-400"
        />
        <span className="text-graphite-soft">:</span>
        <input
          inputMode="numeric"
          defaultValue={m.score_b ?? ''}
          key={`b${m.id}:${m.score_b ?? ''}`}
          onBlur={(e) => onScore(m, 'b', e.target.value)}
          className="w-12 rounded-lg bg-white px-1 py-2 text-center text-base tabular outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-moss-400"
        />
        <TeamCell m={m} side="b" klassen={klassen} onTeam={onTeam} />
      </div>
      <div className="mt-1 flex w-full gap-1">
        {STATUS.map((st) => (
          <button
            key={st.id}
            onClick={() => onStatus(m, st.id)}
            className={cx(
              'min-h-9 flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition',
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
    </motion.div>
  )
}

function TeamCell({
  m,
  side,
  klassen,
  onTeam,
}: {
  m: VolleyMatch
  side: 'a' | 'b'
  klassen?: string[]
  onTeam?: (m: VolleyMatch, side: 'a' | 'b', value: string) => void
}) {
  const value = side === 'a' ? m.team_a : m.team_b
  const align = side === 'a' ? 'text-right' : 'text-left'
  if (klassen && onTeam) {
    return (
      <select
        value={klassen.includes(value) ? value : ''}
        onChange={(e) => onTeam(m, side, e.target.value)}
        className={cx('min-w-0 flex-1 rounded-lg bg-white px-1.5 py-1.5 text-base font-bold text-graphite outline-none ring-1 ring-black/10', align)}
      >
        <option value="">{value || '—'}</option>
        {klassen.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
    )
  }
  return <span className={cx('min-w-0 flex-1 truncate text-sm font-bold text-graphite', align)}>{value}</span>
}
