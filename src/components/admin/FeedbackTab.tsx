import { useEffect, useMemo, useState } from 'react'
import { Download, Lightbulb, Printer, QrCode, RefreshCw, Trash2 } from 'lucide-react'
import { deleteFeedback, fetchFeedback } from '@/lib/api'
import { exportFeedbackCSV } from '@/lib/exporters'
import type { FeedbackEntry, FeedbackRolle } from '@/lib/types'
import { Button, EmblemLoader, GlassCard } from '@/components/ui'
import { FeedbackReportSheet } from '@/components/FeedbackReportSheet'
import { PrintPortal } from '@/components/PrintPortal'
import { cx } from '@/lib/format'

const ROLLE_LABEL: Record<FeedbackRolle, string> = { schueler: 'Schüler', lehrkraft: 'Lehrkraft', gast: 'Gast' }
const LEHRER_ROLLE_LABEL = { station: 'Stationsbetreuung', begleitung: 'Klassenbegleitung', dabei: 'ohne Aufgabe' } as const
const WIEDER_LABEL = { ja: 'Ja, auf jeden Fall', 'mit-aenderungen': 'Ja, mit Änderungen', nein: 'Lieber nicht' } as const
const ESSEN_LABEL = { lecker: 'Richtig lecker', okay: 'War okay', 'nicht-so': 'Nicht so meins', 'nicht-da': 'War nicht dort' } as const
const VOLLEY_LABEL = { gespielt: 'Selbst gespielt', zugeschaut: 'Zugeschaut', verpasst: 'Verpasst' } as const
const ORGA_LABEL = { rund: 'Lief rund', okay: 'Ging so', chaotisch: 'Chaotisch' } as const
const LAENGE_LABEL = { 'zu-kurz': 'Zu kurz', 'genau-richtig': 'Genau richtig', 'zu-lang': 'Zu lang' } as const
const WEBSITE_LABEL = { top: 'Gut umgesetzt', ausbaufaehig: 'Idee top, hakte', 'nicht-genutzt': 'Kaum genutzt' } as const
type Segment = 'alle' | FeedbackRolle

const fmtAvg = (n: number) => n.toFixed(1).replace('.', ',')
const pct = (part: number, total: number) => Math.round((part / Math.max(1, total)) * 100)

function rank(values: string[]): Array<[string, number]> {
  return [...values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])
}

function jahrgangOf(klasse: string | null): number | null {
  if (!klasse) return null
  const m = klasse.match(/\d+/)
  return m ? Number(m[0]) : null
}

function buildInsights(entries: FeedbackEntry[]): string[] {
  const out: string[] = []
  const avgOf = (list: FeedbackEntry[]) => list.reduce((s, e) => s + e.rating, 0) / list.length

  const schueler = entries.filter((e) => e.rolle === 'schueler')
  const lehrer = entries.filter((e) => e.rolle === 'lehrkraft')
  if (schueler.length && lehrer.length) {
    const sa = avgOf(schueler)
    const la = avgOf(lehrer)
    out.push(
      Math.abs(sa - la) < 0.3
        ? `Schüler (Ø ${fmtAvg(sa)}) und Lehrkräfte (Ø ${fmtAvg(la)}) sind sich einig.`
        : sa > la
          ? `Schüler bewerten besser (Ø ${fmtAvg(sa)}) als Lehrkräfte (Ø ${fmtAvg(la)}).`
          : `Lehrkräfte bewerten besser (Ø ${fmtAvg(la)}) als Schüler (Ø ${fmtAvg(sa)}).`,
    )
  }

  const topStation = rank(entries.map((e) => e.beste_station).filter(Boolean) as string[])[0]
  if (topStation) out.push(`Beliebteste Station: ${topStation[0]} (${topStation[1]}×).`)

  const topHighlight = rank(entries.flatMap((e) => e.highlights))[0]
  if (topHighlight) out.push(`Kam am besten an: ${topHighlight[0]} (${topHighlight[1]}×).`)

  const topKritik = rank(entries.flatMap((e) => e.kritik))[0]
  if (topKritik) out.push(`Größter Kritikpunkt: ${topKritik[0]} (${topKritik[1]}×).`)

  const gegessen = entries.filter((e) => e.essen && e.essen !== 'nicht-da')
  if (gegessen.length >= 3) {
    const lecker = gegessen.filter((e) => e.essen === 'lecker').length
    const nichtSo = gegessen.filter((e) => e.essen === 'nicht-so').length
    if (nichtSo / gegessen.length > 0.3) out.push(`Achtung Essen: ${pct(nichtSo, gegessen.length)} % sagen „nicht so meins".`)
    else out.push(`Essen kommt an: ${pct(lecker, gegessen.length)} % fanden es richtig lecker.`)
  }

  const orgaAntworten = entries.filter((e) => e.orga)
  if (orgaAntworten.length >= 3) {
    const chaotisch = orgaAntworten.filter((e) => e.orga === 'chaotisch').length
    if (chaotisch / orgaAntworten.length > 0.25) out.push(`Achtung Orga: ${pct(chaotisch, orgaAntworten.length)} % fanden den Ablauf chaotisch.`)
  }
  const topOrgaDetail = rank(entries.flatMap((e) => e.orga_detail ?? []))[0]
  if (topOrgaDetail) out.push(`Häufigster Orga-Punkt: ${topOrgaDetail[0]} (${topOrgaDetail[1]}×).`)
  const topEssenDetail = rank(entries.flatMap((e) => e.essen_detail ?? []))[0]
  if (topEssenDetail) out.push(`Häufigster Essens-Punkt: ${topEssenDetail[0]} (${topEssenDetail[1]}×).`)

  const websiteAntworten = entries.filter((e) => e.website)
  if (websiteAntworten.length >= 3) {
    const hakte = websiteAntworten.filter((e) => e.website === 'ausbaufaehig').length
    const kannteNicht = websiteAntworten.filter((e) => e.website === 'nicht-genutzt').length
    if (hakte / websiteAntworten.length > 0.3) {
      const topIssue = rank(entries.flatMap((e) => e.website_detail ?? []))[0]
      out.push(`Achtung Website: ${pct(hakte, websiteAntworten.length)} % fanden die Umsetzung ausbaufähig${topIssue ? ` — vor allem „${topIssue[0]}"` : ''}.`)
    }
    if (kannteNicht / websiteAntworten.length > 0.4) out.push(`Website-Kommunikation: ${pct(kannteNicht, websiteAntworten.length)} % haben die Seite kaum genutzt.`)
  }

  const laengeAntworten = entries.filter((e) => e.laenge)
  if (laengeAntworten.length >= 3) {
    const zuLang = laengeAntworten.filter((e) => e.laenge === 'zu-lang').length
    const zuKurz = laengeAntworten.filter((e) => e.laenge === 'zu-kurz').length
    if (zuLang / laengeAntworten.length > 0.4) out.push(`${pct(zuLang, laengeAntworten.length)} % fanden den Tag zu lang.`)
    else if (zuKurz / laengeAntworten.length > 0.4) out.push(`${pct(zuKurz, laengeAntworten.length)} % hätten gern mehr Zeit gehabt.`)
  }

  const beantwortet = entries.filter((e) => e.wieder)
  if (beantwortet.length >= 3) {
    const dafuer = beantwortet.filter((e) => e.wieder !== 'nein').length
    out.push(`${pct(dafuer, beantwortet.length)} % wollen das Sommerfest nächstes Jahr wieder.`)
  }

  const jgGroups = new Map<number, FeedbackEntry[]>()
  for (const e of entries) {
    const jg = jahrgangOf(e.klasse)
    if (jg !== null) jgGroups.set(jg, [...(jgGroups.get(jg) ?? []), e])
  }
  const jgAvgs = [...jgGroups].filter(([, list]) => list.length >= 2).map(([jg, list]) => [jg, avgOf(list)] as const)
  if (jgAvgs.length >= 2) {
    const best = jgAvgs.reduce((a, b) => (b[1] > a[1] ? b : a))
    const worst = jgAvgs.reduce((a, b) => (b[1] < a[1] ? b : a))
    if (best[0] !== worst[0]) {
      out.push(`Jahrgang ${best[0]} feiert das Fest am meisten (Ø ${fmtAvg(best[1])}), Jahrgang ${worst[0]} ist am kritischsten (Ø ${fmtAvg(worst[1])}).`)
    }
  }

  const unzufrieden = entries.filter((e) => e.rating <= 2)
  if (entries.length >= 5 && unzufrieden.length / entries.length > 0.25) {
    out.push(`Achtung: ${pct(unzufrieden.length, entries.length)} % vergeben nur 1–2 Säulen.`)
  }

  return out
}

function BarRow({ label, value, max, tone = 'moss' }: { label: string; value: number; max: number; tone?: 'moss' | 'brass' | 'crimson' }) {
  const fill = tone === 'moss' ? 'bg-moss-500' : tone === 'brass' ? 'bg-brass-400' : 'bg-crimson-400'
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between font-semibold text-graphite">
        <span className="truncate pr-2">{label}</span>
        <span className="tabular text-graphite-soft">{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-graphite/[0.06]">
        <div className={cx('h-full rounded-full', fill)} style={{ width: `${(value / Math.max(1, max)) * 100}%` }} />
      </div>
    </div>
  )
}

export function FeedbackTab() {
  const [entries, setEntries] = useState<FeedbackEntry[] | null>(null)
  const [segment, setSegment] = useState<Segment>('alle')

  const load = () => {
    setEntries(null)
    fetchFeedback().then(setEntries).catch(() => setEntries([]))
  }
  useEffect(load, [])

  const remove = async (id: string) => {
    if (!window.confirm('Diesen Eintrag löschen?')) return
    try {
      await deleteFeedback(id)
      setEntries((prev) => prev?.filter((e) => e.id !== id) ?? prev)
    } catch {
      load()
    }
  }

  const insights = useMemo(() => (entries ? buildInsights(entries) : []), [entries])

  if (entries === null)
    return (
      <div className="grid place-items-center py-16">
        <EmblemLoader />
      </div>
    )

  const seg = segment === 'alle' ? entries : entries.filter((e) => e.rolle === segment)
  const avg = seg.length ? seg.reduce((sum, e) => sum + e.rating, 0) / seg.length : 0
  const dist = [1, 2, 3, 4, 5].map((r) => seg.filter((e) => e.rating === r).length)
  const maxDist = Math.max(1, ...dist)
  const highlights = rank(seg.flatMap((e) => e.highlights))
  const kritik = rank(seg.flatMap((e) => e.kritik))
  const stationRank = rank(seg.map((e) => e.beste_station).filter(Boolean) as string[])
  const essen = (['lecker', 'okay', 'nicht-so', 'nicht-da'] as const).map((v) => [v, seg.filter((e) => e.essen === v).length] as const)
  const volley = (['gespielt', 'zugeschaut', 'verpasst'] as const).map((v) => [v, seg.filter((e) => e.volleyball === v).length] as const)
  const orga = (['rund', 'okay', 'chaotisch'] as const).map((v) => [v, seg.filter((e) => e.orga === v).length] as const)
  const laenge = (['zu-kurz', 'genau-richtig', 'zu-lang'] as const).map((v) => [v, seg.filter((e) => e.laenge === v).length] as const)
  const website = (['top', 'ausbaufaehig', 'nicht-genutzt'] as const).map((v) => [v, seg.filter((e) => e.website === v).length] as const)
  const wieder = (['ja', 'mit-aenderungen', 'nein'] as const).map((w) => [w, seg.filter((e) => e.wieder === w).length] as const)
  const jgGroups = new Map<number, number[]>()
  for (const e of seg) {
    const jg = jahrgangOf(e.klasse)
    if (jg !== null) jgGroups.set(jg, [...(jgGroups.get(jg) ?? []), e.rating])
  }
  const jahrgaenge = [...jgGroups].map(([jg, ratings]) => ({ jg, n: ratings.length, avg: ratings.reduce((a, b) => a + b, 0) / ratings.length })).sort((a, b) => a.jg - b.jg)
  const counts = (r: Segment) => (r === 'alle' ? entries.length : entries.filter((e) => e.rolle === r).length)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-graphite-soft">Anonymes Feedback von der Website — Fragen verzweigen je nach Antwort.</p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/feedback-qr"
            target="_blank"
            rel="noreferrer"
            className="sheen inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full glass px-4 py-1.5 text-sm font-bold text-graphite transition-colors hover:bg-white/80"
          >
            <QrCode className="h-4 w-4" /> QR-Plakat
          </a>
          {entries.length > 0 && (
            <>
              <Button size="sm" variant="glass" onClick={() => exportFeedbackCSV(entries)}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button size="sm" variant="glass" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Drucken / PDF
              </Button>
            </>
          )}
          <Button size="sm" variant="glass" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Aktualisieren
          </Button>
        </div>
      </div>

      {entries.length > 0 && (
        <PrintPortal>
          <FeedbackReportSheet entries={entries} insights={insights} />
        </PrintPortal>
      )}

      {entries.length === 0 ? (
        <GlassCard className="p-8 text-center text-graphite-soft">Noch kein Feedback eingegangen.</GlassCard>
      ) : (
        <>
          {insights.length > 0 && (
            <GlassCard className="p-5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brass-400/15 text-brass-500">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <span className="label-mono text-[11px] text-graphite-soft">Erkenntnisse · über alle Antworten</span>
              </div>
              <ul className="mt-3 space-y-2">
                {insights.map((text) => (
                  <li key={text} className="flex gap-2.5 text-sm font-medium text-graphite">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moss-500" /> {text}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          <div className="flex gap-1 overflow-x-auto rounded-full glass p-1.5 no-scrollbar">
            {(['alle', 'schueler', 'lehrkraft', 'gast'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSegment(s)}
                className={cx(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors',
                  segment === s ? 'bg-moss-600 text-white' : 'text-graphite-soft hover:text-graphite',
                )}
              >
                {s === 'alle' ? 'Alle' : ROLLE_LABEL[s] + (s === 'gast' ? '/Eltern' : '')}
                <span className={cx('rounded-full px-1.5 text-[11px] tabular', segment === s ? 'bg-white/20' : 'bg-graphite/[0.07]')}>{counts(s)}</span>
              </button>
            ))}
          </div>

          {seg.length === 0 ? (
            <GlassCard className="p-8 text-center text-graphite-soft">In diesem Segment gibt es noch keine Antworten.</GlassCard>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <GlassCard className="p-5">
                  <span className="label-mono text-[11px] text-graphite-soft">Schnitt</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-5xl text-graphite tabular">{fmtAvg(avg)}</span>
                    <span className="text-sm text-graphite-soft">
                      von 5 · {seg.length} {seg.length === 1 ? 'Stimme' : 'Stimmen'}
                    </span>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((r) => (
                      <div key={r} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-right font-bold tabular text-graphite">{r}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-graphite/[0.06]">
                          <div className="h-full rounded-full bg-moss-500" style={{ width: `${(dist[r - 1] / maxDist) * 100}%` }} />
                        </div>
                        <span className="w-6 tabular text-graphite-soft">{dist[r - 1]}</span>
                      </div>
                    ))}
                  </div>
                  {jahrgaenge.length > 0 && (
                    <>
                      <span className="label-mono mt-5 block text-[11px] text-graphite-soft">Ø nach Jahrgang</span>
                      <div className="mt-2 space-y-1.5">
                        {jahrgaenge.map(({ jg, n, avg: a }) => (
                          <div key={jg} className="flex items-center gap-2 text-xs">
                            <span className="w-8 shrink-0 text-right font-bold tabular text-graphite">Jg. {jg}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-graphite/[0.06]">
                              <div className="h-full rounded-full bg-moss-500" style={{ width: `${(a / 5) * 100}%` }} />
                            </div>
                            <span className="w-14 shrink-0 tabular text-graphite-soft">
                              {fmtAvg(a)} · {n}×
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </GlassCard>

                <GlassCard className="p-5">
                  <span className="label-mono text-[11px] text-graphite-soft">Beste Station</span>
                  {stationRank.length === 0 ? (
                    <p className="mt-3 text-sm text-graphite-soft">Noch keine Nennungen.</p>
                  ) : (
                    <div className="mt-3 space-y-2.5">
                      {stationRank.slice(0, 8).map(([name, n]) => (
                        <BarRow key={name} label={name} value={n} max={stationRank[0][1]} tone="moss" />
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <GlassCard className="p-5">
                  <span className="label-mono text-[11px] text-graphite-soft">Verpflegung</span>
                  <div className="mt-3 space-y-2.5">
                    {essen.map(([v, n]) => (
                      <BarRow key={v} label={ESSEN_LABEL[v]} value={n} max={Math.max(...essen.map(([, x]) => x))} tone={v === 'nicht-so' ? 'crimson' : 'brass'} />
                    ))}
                  </div>
                  <span className="label-mono mt-5 block text-[11px] text-graphite-soft">Volleyball</span>
                  <div className="mt-2 space-y-2.5">
                    {volley.map(([v, n]) => (
                      <BarRow key={v} label={VOLLEY_LABEL[v]} value={n} max={Math.max(...volley.map(([, x]) => x))} tone="moss" />
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <span className="label-mono text-[11px] text-graphite-soft">Orga & Ablauf</span>
                  <div className="mt-3 space-y-2.5">
                    {orga.map(([v, n]) => (
                      <BarRow key={v} label={ORGA_LABEL[v]} value={n} max={Math.max(...orga.map(([, x]) => x))} tone={v === 'chaotisch' ? 'crimson' : 'moss'} />
                    ))}
                  </div>
                  <span className="label-mono mt-5 block text-[11px] text-graphite-soft">Länge des Tages</span>
                  <div className="mt-2 space-y-2.5">
                    {laenge.map(([v, n]) => (
                      <BarRow key={v} label={LAENGE_LABEL[v]} value={n} max={Math.max(...laenge.map(([, x]) => x))} tone={v === 'genau-richtig' ? 'moss' : 'brass'} />
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <span className="label-mono text-[11px] text-graphite-soft">Nächstes Jahr wieder?</span>
                  <div className="mt-3 space-y-2.5">
                    {wieder.map(([w, n]) => (
                      <BarRow key={w} label={WIEDER_LABEL[w]} value={n} max={Math.max(...wieder.map(([, x]) => x))} tone={w === 'nein' ? 'crimson' : w === 'ja' ? 'moss' : 'brass'} />
                    ))}
                  </div>
                  <span className="label-mono mt-5 block text-[11px] text-graphite-soft">Website</span>
                  <div className="mt-2 space-y-2.5">
                    {website.map(([v, n]) => (
                      <BarRow key={v} label={WEBSITE_LABEL[v]} value={n} max={Math.max(...website.map(([, x]) => x))} tone={v === 'ausbaufaehig' ? 'crimson' : v === 'top' ? 'moss' : 'brass'} />
                    ))}
                  </div>
                </GlassCard>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <GlassCard className="p-5">
                  <span className="label-mono text-[11px] text-graphite-soft">Highlights</span>
                  {highlights.length === 0 ? (
                    <p className="mt-3 text-sm text-graphite-soft">Noch keine Highlights ausgewählt.</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {highlights.map(([name, count]) => (
                        <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-moss-500/10 px-3 py-1.5 text-xs font-semibold text-moss-700">
                          {name} <b className="tabular">{count}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </GlassCard>
                <GlassCard className="p-5">
                  <span className="label-mono text-[11px] text-graphite-soft">Kritikpunkte</span>
                  {kritik.length === 0 ? (
                    <p className="mt-3 text-sm text-graphite-soft">Keine Kritikpunkte — gutes Zeichen.</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {kritik.map(([name, count]) => (
                        <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-crimson-500/10 px-3 py-1.5 text-xs font-semibold text-crimson-600">
                          {name} <b className="tabular">{count}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>

              <div className="space-y-1.5">
                {seg.map((e) => (
                  <GlassCard key={e.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={cx(
                          'mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular',
                          e.rating >= 4 ? 'bg-moss-500/12 text-moss-700' : e.rating === 3 ? 'bg-brass-400/15 text-brass-500' : 'bg-crimson-500/10 text-crimson-600',
                        )}
                      >
                        {e.rating}/5
                      </span>
                      <div className="min-w-0 flex-1">
                        {e.kommentar && <p className="text-sm leading-relaxed text-graphite">{e.kommentar}</p>}
                        {(e.kritik.length > 0 || e.highlights.length > 0 || e.beste_station || (e.essen_detail?.length ?? 0) > 0 || (e.orga_detail?.length ?? 0) > 0 || (e.website_detail?.length ?? 0) > 0) && (
                          <div className={cx('flex flex-wrap gap-1.5', e.kommentar && 'mt-1.5')}>
                            {e.kritik.map((k) => (
                              <span key={k} className="rounded-full bg-crimson-500/[0.08] px-2 py-0.5 text-[11px] font-semibold text-crimson-600">
                                {k}
                              </span>
                            ))}
                            {(e.essen_detail ?? []).map((k) => (
                              <span key={k} className="rounded-full bg-crimson-500/[0.08] px-2 py-0.5 text-[11px] font-semibold text-crimson-600">
                                Essen: {k}
                              </span>
                            ))}
                            {(e.orga_detail ?? []).map((k) => (
                              <span key={k} className="rounded-full bg-crimson-500/[0.08] px-2 py-0.5 text-[11px] font-semibold text-crimson-600">
                                Orga: {k}
                              </span>
                            ))}
                            {(e.website_detail ?? []).map((k) => (
                              <span key={k} className="rounded-full bg-crimson-500/[0.08] px-2 py-0.5 text-[11px] font-semibold text-crimson-600">
                                Website: {k}
                              </span>
                            ))}
                            {e.beste_station && (
                              <span className="rounded-full bg-electric-500/10 px-2 py-0.5 text-[11px] font-semibold text-[#0f766e]">
                                Beste Station: {e.beste_station}
                              </span>
                            )}
                            {e.highlights.map((h) => (
                              <span key={h} className="rounded-full bg-graphite/[0.05] px-2 py-0.5 text-[11px] font-semibold text-graphite-soft">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="mt-1 block text-xs text-graphite-soft/70">
                          {[
                            e.rolle ? ROLLE_LABEL[e.rolle] : null,
                            e.klasse,
                            e.lehrer_rolle ? LEHRER_ROLLE_LABEL[e.lehrer_rolle] : null,
                            e.wieder ? `Wieder: ${WIEDER_LABEL[e.wieder]}` : null,
                            new Date(e.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                      <button
                        onClick={() => remove(e.id)}
                        aria-label="Eintrag löschen"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-graphite-soft/60 transition hover:bg-crimson-500/10 hover:text-crimson-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
