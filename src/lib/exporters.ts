import type { FeedbackEntry, LeaderboardRow, Score, StationPublic, Team } from './types'
import { rankMap } from './format'

function csvCell(v: string | number | null | undefined): string {
  let s = String(v ?? '')
  // Formel-Injection verhindern: TEXT-Zellen, die mit = + - @ (o.Ä.) beginnen, könnten
  // in Excel/Numbers als Formel ausgeführt werden. Führendes Hochkomma neutralisiert das.
  // Echte Zahlen (auch negative) bleiben unangetastet, damit sie Zahl bleiben.
  if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
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

const FB = {
  rolle: { schueler: 'Schüler', lehrkraft: 'Lehrkraft', gast: 'Gast' },
  lehrerRolle: { station: 'Stationsbetreuung', begleitung: 'Klassenbegleitung', dabei: 'Ohne Aufgabe' },
  essen: { lecker: 'Richtig lecker', okay: 'War okay', 'nicht-so': 'Nicht so meins', 'nicht-da': 'War nicht dort' },
  volleyball: { gespielt: 'Selbst gespielt', zugeschaut: 'Zugeschaut', verpasst: 'Verpasst' },
  orga: { rund: 'Lief rund', okay: 'Ging so', chaotisch: 'Chaotisch' },
  laenge: { 'zu-kurz': 'Zu kurz', 'genau-richtig': 'Genau richtig', 'zu-lang': 'Zu lang' },
  website: { top: 'Gut umgesetzt', ausbaufaehig: 'Idee top, hakte', 'nicht-genutzt': 'Kaum genutzt' },
  wieder: { ja: 'Ja, auf jeden Fall', 'mit-aenderungen': 'Ja, mit Änderungen', nein: 'Lieber nicht' },
} as const

export function exportFeedbackCSV(entries: FeedbackEntry[]) {
  const header = [
    'Datum', 'Rolle', 'Klasse', 'Lehrer-Rolle', 'Bewertung (1-5)', 'Highlights', 'Kritik', 'Beste Station',
    'Essen', 'Essen-Details', 'Volleyball', 'Orga', 'Orga-Details', 'Länge', 'Website', 'Website-Details',
    'Nächstes Jahr wieder', 'Kommentar',
  ]
  const lines = [header.map(csvCell).join(';')]
  for (const e of entries) {
    lines.push(
      [
        new Date(e.created_at).toLocaleString('de-DE'),
        e.rolle ? FB.rolle[e.rolle] : '',
        e.klasse ?? '',
        e.lehrer_rolle ? FB.lehrerRolle[e.lehrer_rolle] : '',
        e.rating,
        e.highlights.join(', '),
        e.kritik.join(', '),
        e.beste_station ?? '',
        e.essen ? FB.essen[e.essen] : '',
        (e.essen_detail ?? []).join(', '),
        e.volleyball ? FB.volleyball[e.volleyball] : '',
        e.orga ? FB.orga[e.orga] : '',
        (e.orga_detail ?? []).join(', '),
        e.laenge ? FB.laenge[e.laenge] : '',
        e.website ? FB.website[e.website] : '',
        (e.website_detail ?? []).join(', '),
        e.wieder ? FB.wieder[e.wieder] : '',
        e.kommentar ?? '',
      ]
        .map(csvCell)
        .join(';'),
    )
  }
  download('sommerfest-feedback.csv', lines.join('\n'))
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
