import type { LeaderboardRow } from '@/lib/types'
import { fmt, rankMap } from '@/lib/format'
import { PrintPortal } from './PrintPortal'

const MEDAL = ['#d4af37', '#a7adb5', '#c08457']

export function PrintSheet({ rows }: { rows: LeaderboardRow[] }) {
  const ranks = rankMap(rows)
  const podium = rows.slice(0, 3)
  const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <PrintPortal>
    <div style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact', fontFamily: 'var(--font-sans)', color: '#14201a' }}>
      <div style={{ padding: '15mm 14mm' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '2px solid #047857', paddingBottom: 14 }}>
          <img src="/ehg-logo.png" alt="" style={{ height: 64, width: 'auto' }} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5a6b61', fontWeight: 600 }}>
              Ernst-Haeckel-Gymnasium Werder
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Sommerfest 2026 — <span style={{ color: '#047857' }}>Ergebnisse</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 12, color: '#5a6b61' }}>{date}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
          {podium.map((r, idx) => (
            <div key={r.team_id} style={{ border: `1.5px solid ${MEDAL[idx]}`, borderRadius: 16, padding: '14px 10px', textAlign: 'center', background: '#fcfdfc' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  margin: '0 auto',
                  borderRadius: '999px',
                  background: MEDAL[idx],
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 16,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {idx + 1}
              </div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>{r.name}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#047857', lineHeight: 1.1 }}>{fmt(r.gesamt)}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5a6b61' }}>Punkte</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          {rows.map((r) => {
            const rank = ranks.get(r.team_id) ?? 0
            return (
              <div
                key={r.team_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '7px 4px',
                  borderBottom: '1px solid #e6ece8',
                  fontSize: 14,
                }}
              >
                <span style={{ width: 28, fontWeight: 700, color: '#5a6b61', fontVariantNumeric: 'tabular-nums' }}>{rank}.</span>
                <span style={{ width: 10, height: 10, borderRadius: '999px', background: r.farbe, display: 'inline-block' }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.gesamt)}</span>
                <span style={{ fontSize: 10, color: '#5a6b61', width: 44, textAlign: 'right' }}>Punkte</span>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 18, fontSize: 10, color: '#9aa69e', textAlign: 'center' }}>
          Erstellt mit dem Sommerfest-Live-System · Ernst-Haeckel-Gymnasium Werder (Havel)
        </div>
      </div>
    </div>
    </PrintPortal>
  )
}
