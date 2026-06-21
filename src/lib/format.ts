import type { LeaderboardRow, Score, StationPublic, Team } from './types'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const nf = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
export function fmt(n: number): string {
  return nf.format(n)
}

export const MEDAL: Record<number, { ring: string; bg: string; label: string }> = {
  1: { ring: '#f5b301', bg: 'linear-gradient(135deg,#fde68a,#f5b301)', label: '🥇' },
  2: { ring: '#b8c2cc', bg: 'linear-gradient(135deg,#e5e7eb,#9ca3af)', label: '🥈' },
  3: { ring: '#cd7f48', bg: 'linear-gradient(135deg,#fcd9b6,#cd7f48)', label: '🥉' },
}

export function computeLeaderboard(
  teams: Team[],
  stations: StationPublic[],
  scores: Score[],
): LeaderboardRow[] {
  const weight = new Map(stations.filter((s) => s.aktiv).map((s) => [s.id, s.gewicht]))
  const totals = new Map<string, { sum: number; count: number }>()

  for (const s of scores) {
    const w = weight.get(s.station_id)
    if (w === undefined) continue
    const cur = totals.get(s.team_id) ?? { sum: 0, count: 0 }
    cur.sum += s.punkte * w
    cur.count += 1
    totals.set(s.team_id, cur)
  }

  const rows: LeaderboardRow[] = teams.map((t) => {
    const agg = totals.get(t.id) ?? { sum: 0, count: 0 }
    return {
      team_id: t.id,
      name: t.name,
      jahrgang: t.jahrgang,
      farbe: t.farbe,
      sort: t.sort,
      gesamt: Math.round(agg.sum * 100) / 100,
      stationen_gewertet: agg.count,
    }
  })

  rows.sort((a, b) => b.gesamt - a.gesamt || a.name.localeCompare(b.name, 'de'))
  return rows
}

const JG_COLORS: Record<number, string> = {
  5: '#f59e0b',
  6: '#22c55e',
  7: '#3b82f6',
  8: '#8b5cf6',
  9: '#ec4899',
  10: '#14b8a6',
}

export function computeJahrgangWertung(rows: LeaderboardRow[]): LeaderboardRow[] {
  const groups = new Map<number, LeaderboardRow[]>()
  for (const r of rows) {
    if (r.jahrgang == null) continue
    const arr = groups.get(r.jahrgang) ?? []
    arr.push(r)
    groups.set(r.jahrgang, arr)
  }
  const out: LeaderboardRow[] = []
  for (const [jg, arr] of groups) {
    const avg = arr.reduce((a, r) => a + r.gesamt, 0) / arr.length
    out.push({
      team_id: `jg-${jg}`,
      name: `${jg}er`,
      jahrgang: jg,
      farbe: JG_COLORS[jg] ?? '#10b981',
      sort: jg,
      gesamt: Math.round(avg * 100) / 100,
      stationen_gewertet: arr.length,
    })
  }
  out.sort((a, b) => b.gesamt - a.gesamt || a.name.localeCompare(b.name, 'de'))
  return out
}

export function rankMap(rows: LeaderboardRow[]): Map<string, number> {
  const map = new Map<string, number>()
  let lastScore = Number.NaN
  let lastRank = 0
  rows.forEach((row, i) => {
    const rank = row.gesamt === lastScore ? lastRank : i + 1
    map.set(row.team_id, rank)
    lastScore = row.gesamt
    lastRank = rank
  })
  return map
}

const SWEEP: Array<[number, number, number]> = [
  [110, 231, 183],
  [16, 185, 129],
  [4, 120, 87],
]
export function rankSweepColor(index: number, total: number): string {
  if (total <= 1) return 'rgb(31,122,77)'
  const t = Math.min(1, Math.max(0, index / (total - 1)))
  const seg = t < 0.5 ? 0 : 1
  const local = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5
  const a = SWEEP[seg]
  const b = SWEEP[seg + 1]
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * local))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}
