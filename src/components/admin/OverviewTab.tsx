import { useEffect, useMemo, useState } from 'react'
import { Award, Medal, Printer, Table2, Trophy } from 'lucide-react'
import { adminSetScore } from '@/lib/api'
import type { LeaderboardRow, Score, StationAdmin, Team } from '@/lib/types'
import { Button } from '@/components/ui'
import { StationIcon } from '@/components/icons'
import { exportMatrixCSV, exportResultsCSV } from '@/lib/exporters'
import { PrintSheet } from '@/components/PrintSheet'
import { CertificateSheet, type Cert } from '@/components/CertificateSheet'
import { computeLeaderboard, fmt, rankMap } from '@/lib/format'

const MEDAL3 = ['#d4af37', '#a7adb5', '#c08457']
const PLATZ = ['1. Platz', '2. Platz', '3. Platz']

type PrintMode = 'results' | 'cert-top3' | 'cert-jg'

export function OverviewTab({
  teams,
  stations,
  scores,
  reload,
}: {
  teams: Team[]
  stations: StationAdmin[]
  scores: Score[]
  reload: () => void
}) {
  const [map, setMap] = useState<Record<string, number>>({})
  const [printMode, setPrintMode] = useState<PrintMode | null>(null)

  useEffect(() => {
    setMap(Object.fromEntries(scores.map((s) => [`${s.station_id}:${s.team_id}`, s.punkte])))
  }, [scores])

  useEffect(() => {
    if (!printMode) return
    const t = window.setTimeout(() => window.print(), 80)
    const reset = () => setPrintMode(null)
    window.addEventListener('afterprint', reset)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('afterprint', reset)
    }
  }, [printMode])

  const totals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const team of teams) {
      let sum = 0
      for (const st of stations) {
        if (!st.aktiv) continue
        const v = map[`${st.id}:${team.id}`]
        if (typeof v === 'number') sum += v * st.gewicht
      }
      t[team.id] = Math.round(sum * 100) / 100
    }
    return t
  }, [teams, stations, map])

  const lb = useMemo(() => computeLeaderboard(teams, stations, scores), [teams, stations, scores])
  const ranks = rankMap(lb)

  const top3Certs = useMemo<Cert[]>(
    () =>
      lb.slice(0, 3).map((r, i) => ({
        seal: String(i + 1),
        title: PLATZ[i],
        context: 'Schulwertung · Sportfest 2026',
        name: r.name,
        points: r.gesamt,
        accent: MEDAL3[i],
        farbe: r.farbe,
      })),
    [lb],
  )

  const jgCerts = useMemo<Cert[]>(() => {
    const best = new Map<number, LeaderboardRow>()
    for (const r of lb) {
      if (r.jahrgang == null) continue
      const cur = best.get(r.jahrgang)
      if (!cur || r.gesamt > cur.gesamt) best.set(r.jahrgang, r)
    }
    return [...best.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([jg, r]) => ({
        seal: '★',
        title: 'Jahrgangsbeste Klasse',
        context: `Jahrgangsstufe ${jg} · Sportfest 2026`,
        name: r.name,
        points: r.gesamt,
        accent: '#047857',
        farbe: r.farbe,
      }))
  }, [lb])

  const commit = async (stationId: string, teamId: string, raw: string) => {
    const key = `${stationId}:${teamId}`
    const parsed = Number.parseFloat(raw.replace(',', '.'))
    if (!Number.isFinite(parsed)) return
    if (map[key] === parsed) return
    setMap((m) => ({ ...m, [key]: parsed }))
    try {
      await adminSetScore(stationId, teamId, parsed)
    } catch {
      reload()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="gold" onClick={() => exportResultsCSV(lb)}>
          <Trophy className="h-4 w-4" /> Ergebnis-CSV
        </Button>
        <Button size="sm" variant="glass" onClick={() => exportMatrixCSV(teams, stations, scores)}>
          <Table2 className="h-4 w-4" /> Matrix-CSV
        </Button>
        <Button size="sm" variant="glass" onClick={() => setPrintMode('results')}>
          <Printer className="h-4 w-4" /> Tabelle drucken
        </Button>
        <Button size="sm" variant="glass" onClick={() => setPrintMode('cert-top3')}>
          <Award className="h-4 w-4 text-brass-400" /> Urkunden · Top 3
        </Button>
        <Button size="sm" variant="glass" onClick={() => setPrintMode('cert-jg')}>
          <Medal className="h-4 w-4 text-moss-600" /> Urkunden · Jahrgänge
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-solid">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-graphite/10">
              <th className="sticky left-0 z-10 bg-paper/90 px-3 py-3 text-left font-bold backdrop-blur">Klasse</th>
              {stations.map((s) => (
                <th key={s.id} className="px-2 py-3 text-center font-semibold text-graphite-soft" title={s.name}>
                  <StationIcon name={s.icon} className="mx-auto h-4 w-4 text-moss-600" />
                  <div className="mt-1 max-w-[4.5rem] truncate text-[10px] font-medium text-graphite-soft/70">{s.name}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-right font-bold text-moss-700">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b border-graphite/8 last:border-0 hover:bg-graphite/[0.02]">
                <td className="sticky left-0 z-10 bg-paper/85 px-3 py-1.5 font-bold backdrop-blur">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: team.farbe }} />
                  {team.name}
                </td>
                {stations.map((s) => {
                  const key = `${s.id}:${team.id}`
                  return (
                    <td key={s.id} className="px-1 py-1 text-center">
                      <input
                        inputMode="decimal"
                        defaultValue={map[key] ?? ''}
                        key={`${key}:${map[key] ?? ''}`}
                        onBlur={(e) => commit(s.id, team.id, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        className="w-14 rounded-lg bg-graphite/[0.04] px-1 py-1.5 text-center tabular outline-none focus:bg-white focus:ring-2 focus:ring-moss-400"
                      />
                    </td>
                  )
                })}
                <td className="px-3 py-1.5 text-right">
                  <span className="font-display text-base font-bold tabular text-moss-700">{fmt(totals[team.id] ?? 0)}</span>
                  <span className="ml-1.5 text-[10px] font-semibold text-graphite-soft/60">#{ranks.get(team.id)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-graphite-soft">
        Tippe in eine Zelle, um einen Wert zu korrigieren (Enter oder Wegtippen speichert). Gesamt ist gewichtet.
      </p>

      {printMode === 'results' && <PrintSheet rows={lb} />}
      {printMode === 'cert-top3' && <CertificateSheet certs={top3Certs} />}
      {printMode === 'cert-jg' && <CertificateSheet certs={jgCerts} />}
    </div>
  )
}
