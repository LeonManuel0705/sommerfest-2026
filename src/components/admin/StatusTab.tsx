import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Lock, Unlock } from 'lucide-react'
import { fetchSettings, setScoreboardFrozen } from '@/lib/api'
import type { Score, StationAdmin, Team } from '@/lib/types'
import { Button } from '@/components/ui'
import { StationIcon } from '@/components/icons'
import { cx } from '@/lib/format'

const STALE_MS = 30 * 60 * 1000

function relTime(ms: number): string {
  if (!ms) return 'noch nichts'
  const diff = Date.now() - ms
  if (diff < 60_000) return 'gerade eben'
  const min = Math.floor(diff / 60_000)
  if (min < 60) return `vor ${min} Min`
  return `vor ${Math.floor(min / 60)} Std`
}

export function StatusTab({ teams, stations, scores }: { teams: Team[]; stations: StationAdmin[]; scores: Score[] }) {
  const [frozen, setFrozen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
      .then((s) => setFrozen(s.scoreboard_frozen))
      .catch(() => {})
  }, [])

  const toggleFrozen = async () => {
    const next = !frozen
    setSaving(true)
    setErr(null)
    setFrozen(next)
    try {
      await setScoreboardFrozen(next)
    } catch (e) {
      setFrozen(!next)
      const msg = e instanceof Error ? e.message : ''
      setErr(
        /settings/i.test(msg) || /schema cache/i.test(msg)
          ? 'Tabelle „settings" fehlt in der DB — bitte die aktuelle setup.sql (bzw. das settings-Snippet) in Supabase ausführen.'
          : `Konnte nicht speichern${msg ? `: ${msg}` : '. Verbindung/Setup prüfen.'}`,
      )
    } finally {
      setSaving(false)
    }
  }

  const total = teams.length
  const rows = stations.map((st) => {
    const entries = scores.filter((s) => s.station_id === st.id)
    const last = entries.reduce((m, s) => Math.max(m, new Date(s.updated_at).getTime()), 0)
    const complete = entries.length >= total && total > 0
    const stale = st.aktiv && !complete && last > 0 && Date.now() - last > STALE_MS
    return { st, filled: entries.length, last, complete, stale }
  })
  const activeCount = stations.filter((s) => s.aktiv).length
  const done = rows.filter((r) => r.complete && r.st.aktiv).length

  return (
    <div className="space-y-5">
      <div className={cx('rounded-3xl p-5 shadow-card ring-1 transition-colors', frozen ? 'bg-graphite text-white ring-black/10' : 'bg-white ring-black/5')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', frozen ? 'bg-white/15 text-white' : 'bg-moss-600/10 text-moss-700')}>
              {frozen ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </span>
            <div>
              <div className={cx('font-display text-xl', frozen ? 'text-white' : 'text-graphite')}>Siegerehrungs-Modus</div>
              <div className={cx('text-sm', frozen ? 'text-white/70' : 'text-graphite-soft')}>
                {frozen
                  ? 'Wertung ist öffentlich verborgen — enthülle sie zur Siegerehrung.'
                  : 'Wertung ist überall live sichtbar. Vor der Siegerehrung einfrieren, um sie spannend zu halten.'}
              </div>
            </div>
          </div>
          <Button onClick={toggleFrozen} disabled={saving} variant={frozen ? 'gold' : 'glass'}>
            {frozen ? (
              <>
                <Unlock className="h-4 w-4" /> Jetzt enthüllen
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Wertung einfrieren
              </>
            )}
          </Button>
        </div>
        {err && (
          <p className={cx('mt-3 rounded-2xl px-4 py-2.5 text-sm font-semibold', frozen ? 'bg-white/15 text-white' : 'bg-crimson-500/12 text-crimson-600')}>{err}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-moss-600/10 px-3 py-1 font-semibold text-moss-700">{done}/{activeCount} Stationen vollständig</span>
        <span className="text-graphite-soft">· {total} Klassen je Station · rot = lange kein Eintrag</span>
      </div>

      <div className="space-y-2">
        {rows.map(({ st, filled, last, complete, stale }) => {
          const pct = total ? Math.round((filled / total) * 100) : 0
          return (
            <div key={st.id} className={cx('rounded-2xl bg-white p-3.5 shadow-card ring-1', stale ? 'ring-crimson-500/30' : 'ring-black/5')}>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-moss-500/10 text-moss-600">
                  <StationIcon name={st.icon} className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-bold text-graphite">{st.name}</span>
                    {!st.aktiv && <span className="rounded-full bg-graphite/10 px-2 py-0.5 text-[10px] font-semibold text-graphite-soft">inaktiv</span>}
                    {!st.pflicht && st.aktiv && <span className="rounded-full bg-brass-400/15 px-2 py-0.5 text-[10px] font-semibold text-brass-500">optional</span>}
                    {complete && st.aktiv && <CheckCircle2 className="h-4 w-4 shrink-0 text-moss-600" />}
                    {stale && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-crimson-500/12 px-2 py-0.5 text-[10px] font-bold text-crimson-600">
                        <AlertTriangle className="h-3 w-3" /> lange still
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-graphite/8">
                    <div className={cx('h-full rounded-full transition-all', complete ? 'bg-moss-500' : stale ? 'bg-crimson-400' : 'bg-brass-400')} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold tabular text-graphite">
                    {filled}/{total}
                  </div>
                  <div className="text-[11px] text-graphite-soft">{relTime(last)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
