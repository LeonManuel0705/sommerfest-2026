import type { FeedbackEntry, FeedbackRolle } from '@/lib/types'

const ROLLE_LABEL: Record<FeedbackRolle, string> = { schueler: 'Schüler', lehrkraft: 'Lehrkraft', gast: 'Gast' }
const WIEDER_LABEL = { ja: 'Ja, auf jeden Fall', 'mit-aenderungen': 'Ja, mit Änderungen', nein: 'Lieber nicht' } as const
const ESSEN_LABEL = { lecker: 'Richtig lecker', okay: 'War okay', 'nicht-so': 'Nicht so meins', 'nicht-da': 'War nicht dort' } as const
const VOLLEY_LABEL = { gespielt: 'Selbst gespielt', zugeschaut: 'Zugeschaut', verpasst: 'Verpasst' } as const
const ORGA_LABEL = { rund: 'Lief rund', okay: 'Ging so', chaotisch: 'Chaotisch' } as const
const LAENGE_LABEL = { 'zu-kurz': 'Zu kurz', 'genau-richtig': 'Genau richtig', 'zu-lang': 'Zu lang' } as const
const WEBSITE_LABEL = { top: 'Gut umgesetzt', ausbaufaehig: 'Idee top, hakte', 'nicht-genutzt': 'Kaum genutzt' } as const

const fmtAvg = (n: number) => n.toFixed(1).replace('.', ',')

function rank(values: string[]): Array<[string, number]> {
  return [...values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])
}

function CountTable({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <div style={{ breakInside: 'avoid' }}>
      <h3 className="border-b border-black/20 pb-1 text-[11px] font-bold uppercase tracking-[0.14em]">{title}</h3>
      <table className="mt-1.5 w-full text-[12px]">
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="py-0.5 text-black/50">Keine Angaben</td>
            </tr>
          ) : (
            rows.map(([label, n]) => (
              <tr key={label}>
                <td className="py-0.5 pr-2">{label}</td>
                <td className="w-10 py-0.5 text-right font-bold tabular-nums">{n}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function FeedbackReportSheet({ entries, insights }: { entries: FeedbackEntry[]; insights: string[] }) {
  const avg = entries.length ? entries.reduce((s, e) => s + e.rating, 0) / entries.length : 0
  const dist = [5, 4, 3, 2, 1].map((r) => [`${r} von 5`, entries.filter((e) => e.rating === r).length] as [string, number])
  const beantwortet = entries.filter((e) => e.wieder)
  const dafuer = beantwortet.filter((e) => e.wieder !== 'nein').length
  const wiederQuote = beantwortet.length ? Math.round((dafuer / beantwortet.length) * 100) : null
  const kommentare = entries.filter((e) => e.kommentar)

  const enumRows = <K extends string>(labels: Record<K, string>, pick: (e: FeedbackEntry) => K | null) =>
    (Object.keys(labels) as K[]).map((k) => [labels[k], entries.filter((e) => pick(e) === k).length] as [string, number])

  return (
    <div className="bg-white px-[14mm] py-[12mm] font-sans text-black">
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Feedback-Auswertung</h1>
          <p className="mt-1 text-sm">Sommerfest 2026 · Ernst-Haeckel-Gymnasium Werder (Havel)</p>
        </div>
        <div className="text-right text-xs text-black/60">
          <p>Stand: {new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</p>
          <p className="mt-0.5">
            {entries.length} {entries.length === 1 ? 'Stimme' : 'Stimmen'} · anonym erhoben
          </p>
        </div>
      </header>

      <section className="mt-4 flex gap-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/60">Gesamtnote</p>
          <p className="font-display text-4xl font-bold tabular-nums">{fmtAvg(avg)} / 5</p>
        </div>
        {wiederQuote !== null && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/60">Nächstes Jahr wieder</p>
            <p className="font-display text-4xl font-bold tabular-nums">{wiederQuote} %</p>
          </div>
        )}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/60">Stimmen</p>
          <p className="font-display text-4xl font-bold tabular-nums">{entries.length}</p>
        </div>
      </section>

      {insights.length > 0 && (
        <section className="mt-5" style={{ breakInside: 'avoid' }}>
          <h2 className="border-b border-black/20 pb-1 text-[11px] font-bold uppercase tracking-[0.14em]">Erkenntnisse</h2>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[12px]">
            {insights.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5 grid grid-cols-3 gap-x-6 gap-y-5">
        <CountTable title="Bewertungs-Verteilung" rows={dist} />
        <CountTable title="Beste Station" rows={rank(entries.map((e) => e.beste_station).filter(Boolean) as string[]).slice(0, 8)} />
        <CountTable title="Nächstes Jahr wieder?" rows={enumRows(WIEDER_LABEL, (e) => e.wieder)} />
        <CountTable title="Highlights" rows={rank(entries.flatMap((e) => e.highlights)).slice(0, 8)} />
        <CountTable title="Kritikpunkte" rows={rank(entries.flatMap((e) => e.kritik)).slice(0, 8)} />
        <CountTable title="Verpflegung" rows={enumRows(ESSEN_LABEL, (e) => e.essen)} />
        <CountTable
          title="Essen — Details"
          rows={rank(entries.flatMap((e) => e.essen_detail ?? [])).slice(0, 8)}
        />
        <CountTable title="Orga & Ablauf" rows={enumRows(ORGA_LABEL, (e) => e.orga)} />
        <CountTable title="Orga — Details" rows={rank(entries.flatMap((e) => e.orga_detail ?? [])).slice(0, 8)} />
        <CountTable title="Länge des Tages" rows={enumRows(LAENGE_LABEL, (e) => e.laenge)} />
        <CountTable title="Website" rows={enumRows(WEBSITE_LABEL, (e) => e.website)} />
        <CountTable title="Website — Details" rows={rank(entries.flatMap((e) => e.website_detail ?? [])).slice(0, 8)} />
        <CountTable title="Volleyball" rows={enumRows(VOLLEY_LABEL, (e) => e.volleyball)} />
      </section>

      {kommentare.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b border-black/20 pb-1 text-[11px] font-bold uppercase tracking-[0.14em]">
            Kommentare ({kommentare.length})
          </h2>
          <div className="mt-2 space-y-2">
            {kommentare.map((e) => (
              <div key={e.id} className="text-[12px]" style={{ breakInside: 'avoid' }}>
                <p className="leading-snug">„{e.kommentar}"</p>
                <p className="mt-0.5 text-[10px] text-black/50">
                  {[
                    `${e.rating}/5`,
                    e.rolle ? ROLLE_LABEL[e.rolle] : null,
                    e.klasse,
                    new Date(e.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-6 border-t border-black/20 pt-2 text-[10px] text-black/50">
        Erhoben über sommerfest-Website /feedback · Auswertung automatisch generiert
      </footer>
    </div>
  )
}
