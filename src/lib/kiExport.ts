import type { AppSettings, FeedbackEntry } from './types'

const LEHRER_ROLLE = { station: 'Stationsbetreuung', begleitung: 'Klassenbegleitung', dabei: 'ohne Aufgabe' } as const
const ESSEN = { lecker: 'lecker', okay: 'okay', 'nicht-so': 'nicht so gut', 'nicht-da': 'nichts gegessen' } as const
const VOLLEY = { gespielt: 'selbst gespielt', zugeschaut: 'zugeschaut', verpasst: 'verpasst' } as const
const ORGA = { rund: 'lief rund', okay: 'ging so', chaotisch: 'chaotisch' } as const
const LAENGE = { 'zu-kurz': 'zu kurz', 'genau-richtig': 'genau richtig', 'zu-lang': 'zu lang' } as const
const WEBSITE = { top: 'top', ausbaufaehig: 'ausbaufähig', 'nicht-genutzt': 'nicht genutzt' } as const
const WIEDER = { ja: 'ja', 'mit-aenderungen': 'ja, mit Änderungen', nein: 'nein' } as const

function tally(values: Array<string | null | undefined>): string {
  const map = new Map<string, number>()
  for (const v of values) if (v) map.set(v, (map.get(v) ?? 0) + 1)
  return [...map]
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} (${n}×)`)
    .join(', ')
}

function verteilung(entries: FeedbackEntry[]): string {
  return [5, 4, 3, 2, 1].map((r) => `${r}★: ${entries.filter((e) => e.rating === r).length}`).join(' · ')
}

function eintragZeile(e: FeedbackEntry, i: number): string {
  const wer =
    e.rolle === 'schueler'
      ? `Schüler:in${e.klasse ? ` ${e.klasse}` : ''}`
      : e.rolle === 'lehrkraft'
        ? `Lehrkraft${e.lehrer_rolle ? ` (${LEHRER_ROLLE[e.lehrer_rolle]})` : ''}`
        : e.rolle === 'gast'
          ? 'Gast'
          : 'ohne Angabe'
  const teile: string[] = [`Bewertung: ${e.rating}/5`]
  if (e.highlights.length) teile.push(`Highlights: ${e.highlights.join(', ')}`)
  if (e.kritik.length) teile.push(`Kritik: ${e.kritik.join(', ')}`)
  if (e.beste_station) teile.push(`Beste Station: ${e.beste_station}`)
  if (e.essen) teile.push(`Essen: ${ESSEN[e.essen]}${e.essen_detail.length ? ` (${e.essen_detail.join(', ')})` : ''}`)
  if (e.volleyball) teile.push(`Volleyball: ${VOLLEY[e.volleyball]}`)
  if (e.orga) teile.push(`Orga: ${ORGA[e.orga]}${e.orga_detail.length ? ` (${e.orga_detail.join(', ')})` : ''}`)
  if (e.laenge) teile.push(`Länge: ${LAENGE[e.laenge]}`)
  if (e.website) teile.push(`Website: ${WEBSITE[e.website]}${e.website_detail.length ? ` (${e.website_detail.join(', ')})` : ''}`)
  if (e.wieder) teile.push(`Nächstes Jahr wieder: ${WIEDER[e.wieder]}`)
  if (e.kommentar) teile.push(`Kommentar: „${e.kommentar}“`)
  return `#${i + 1} · ${wer} · ${teile.join(' | ')}`
}

export function buildKiExport(entries: FeedbackEntry[], settings: AppSettings): string {
  const schueler = entries.filter((e) => e.rolle === 'schueler')
  const lehrer = entries.filter((e) => e.rolle === 'lehrkraft')
  const gaeste = entries.filter((e) => e.rolle === 'gast')
  const avg = entries.length ? entries.reduce((s, e) => s + e.rating, 0) / entries.length : 0
  const avgOf = (list: FeedbackEntry[]) => (list.length ? (list.reduce((s, e) => s + e.rating, 0) / list.length).toFixed(2) : '—')

  const kontext: string[] = []
  if (settings.regen_modus) kontext.push('Das Fest fand nach dem Regenplan statt: Alle Stationen wurden ins Gebäude verlegt (Turnhalle, Aula, Foyer statt Außenflächen).')
  if (!settings.volleyball_aktiv) kontext.push('Das Volleyball-Turnier musste abgesagt werden.')
  if (settings.lehrer_spiel_aktiv) kontext.push('Das Spiel „Lehrkräfte vs. Jahrgang 11“ fand in der Mittagspause statt.')

  return `Du wertest das anonyme Besucher-Feedback eines Schul-Sommerfests aus.

KONTEXT: Sommerfest 2026 am Ernst-Haeckel-Gymnasium Werder (Havel), organisiert vom Jahrgang 11. Ganztägiges Fest mit 11 Wettkampf-Stationen (Klassen sammeln Punkte), Foodcourt und Siegerehrung. ${kontext.join(' ')}
Das Feedback wurde über eine Website erhoben; nicht jede Frage wurde jedem gestellt (der Fragebogen verzweigt), fehlende Angaben sind also normal. Die Kritik-Frage kam nur bei Bewertungen von 3 oder schlechter.

DEINE AUFGABE — erstelle eine Auswertung für das Orga-Team (Schüler des Jahrgangs 11) mit:
1. Gesamtstimmung in 2–3 Sätzen (mit Einordnung der Durchschnittsbewertung)
2. Was am besten ankam — mit Zahlen belegt
3. Die wichtigsten Kritikpunkte — mit Zahlen, und ob sie eher von Schülern oder Lehrkräften kommen
4. Auffällige Muster (Unterschiede zwischen Jahrgängen, Rollen, Widersprüche zwischen Ankreuz-Antworten und Kommentaren)
5. Die 5 wichtigsten, konkreten Empfehlungen für das Sommerfest 2027 — priorisiert
6. 3–5 aussagekräftige Original-Zitate aus den Kommentaren

Sei ehrlich statt schmeichelhaft, stütze jede Aussage auf die Daten, und schreib auf Deutsch.

=== VORBERECHNETER ÜBERBLICK ===
Stimmen gesamt: ${entries.length} (Schüler: ${schueler.length}, Lehrkräfte: ${lehrer.length}, Gäste: ${gaeste.length}, ohne Angabe: ${entries.length - schueler.length - lehrer.length - gaeste.length})
Durchschnittsbewertung: ${avg.toFixed(2)}/5 (Schüler: ${avgOf(schueler)}, Lehrkräfte: ${avgOf(lehrer)})
Verteilung: ${verteilung(entries)}
Highlights (Mehrfachauswahl): ${tally(entries.flatMap((e) => e.highlights)) || '—'}
Kritikpunkte (nur bei Bewertung ≤3 gefragt): ${tally(entries.flatMap((e) => e.kritik)) || '—'}
Beste Station (Nennungen): ${tally(entries.map((e) => e.beste_station)) || '—'}
Essen: ${tally(entries.map((e) => (e.essen ? ESSEN[e.essen] : null))) || '—'}
Essens-Kritik im Detail: ${tally(entries.flatMap((e) => e.essen_detail)) || '—'}
Orga-Eindruck: ${tally(entries.map((e) => (e.orga ? ORGA[e.orga] : null))) || '—'}
Orga-Kritik im Detail: ${tally(entries.flatMap((e) => e.orga_detail)) || '—'}
Länge des Fests: ${tally(entries.map((e) => (e.laenge ? LAENGE[e.laenge] : null))) || '—'}
Website: ${tally(entries.map((e) => (e.website ? WEBSITE[e.website] : null))) || '—'}
Website-Kritik im Detail: ${tally(entries.flatMap((e) => e.website_detail)) || '—'}
Nächstes Jahr wieder: ${tally(entries.map((e) => (e.wieder ? WIEDER[e.wieder] : null))) || '—'}

=== ALLE EINZELNEN STIMMEN (${entries.length}) ===
${entries.map(eintragZeile).join('\n')}
`
}

export function downloadKiExport(text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'feedback-ki-auswertung.txt'
  a.click()
  URL.revokeObjectURL(url)
}
