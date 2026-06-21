import type { LeaderboardRow, Score, StationPublic, Team } from './types'
import { rankMap } from './format'

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? '')
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function download(filename: string, text: string) {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportResultsCSV(rows: LeaderboardRow[]) {
  const ranks = rankMap(rows)
  const lines = [['Platz', 'Klasse', 'Jahrgang', 'Punkte'].map(csvCell).join(';')]
  for (const r of rows) {
    lines.push([ranks.get(r.team_id) ?? '', r.name, r.jahrgang ?? '', r.gesamt].map(csvCell).join(';'))
  }
  download('sportfest-ergebnis.csv', lines.join('\n'))
}

export function exportMatrixCSV(teams: Team[], stations: StationPublic[], scores: Score[]) {
  const map = new Map(scores.map((s) => [`${s.station_id}:${s.team_id}`, s.punkte]))
  const header = ['Klasse', ...stations.map((s) => s.name), 'Gesamt (gewichtet)']
  const lines = [header.map(csvCell).join(';')]
  for (const t of teams) {
    let total = 0
    const cells = stations.map((s) => {
      const v = map.get(`${s.id}:${t.id}`) ?? ''
      if (typeof v === 'number' && s.aktiv) total += v * s.gewicht
      return v
    })
    lines.push([t.name, ...cells, Math.round(total * 100) / 100].map(csvCell).join(';'))
  }
  download('sportfest-matrix.csv', lines.join('\n'))
}
