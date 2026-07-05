import { QRCodeSVG } from 'qrcode.react'
import type { StationAdmin } from '@/lib/types'
import { PrintPortal } from './PrintPortal'

export function StationQRSheet({ stations, origin }: { stations: StationAdmin[]; origin: string }) {
  const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <PrintPortal>
      <div style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact', fontFamily: 'var(--font-sans)', color: '#14201a', padding: '12mm' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid #047857', paddingBottom: 12, marginBottom: 16 }}>
          <img src="/ehg-logo.png" alt="" style={{ height: 54, width: 'auto' }} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5a6b61', fontWeight: 600 }}>
              Ernst-Haeckel-Gymnasium · Sommerfest 2026
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Stations-Zugänge <span style={{ color: '#047857' }}>· QR + PIN</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#5a6b61' }}>{date}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {stations.map((s) => (
            <div
              key={s.id}
              style={{
                border: '1px solid #cdd8d1',
                borderRadius: 14,
                padding: '12px 10px',
                textAlign: 'center',
                background: '#fcfdfc',
                breakInside: 'avoid',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.15, minHeight: 34 }}>{s.name}</div>
              <div style={{ display: 'inline-block', padding: 6, marginTop: 4, background: '#fff', borderRadius: 10, border: '1px solid #e6ece8' }}>
                <QRCodeSVG value={`${origin}/s/${s.token}`} size={108} fgColor="#11261e" />
              </div>
              <div style={{ marginTop: 7, fontSize: 10, color: '#5a6b61', wordBreak: 'break-all' }}>/s/{s.token}</div>
              <div style={{ marginTop: 5, fontSize: 13, fontWeight: 700 }}>
                {s.pin ? (
                  <>
                    PIN: <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.12em' }}>{s.pin}</span>
                  </>
                ) : s.start_pin ? (
                  <>
                    Start-PIN: <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.12em', color: '#b45309' }}>{s.start_pin}</span>
                    <div style={{ marginTop: 2, fontSize: 9, color: '#5a6b61', fontWeight: 600 }}>
                      Beim ersten Öffnen damit eure eigene PIN festlegen
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#9aa69e', fontWeight: 600 }}>PIN beim Orga-Team erfragen</span>
                )}
              </div>
              {!s.aktiv && <div style={{ marginTop: 3, fontSize: 9, color: '#b91c1c', fontWeight: 800, letterSpacing: '0.1em' }}>INAKTIV</div>}
              {!s.pflicht && s.aktiv && <div style={{ marginTop: 3, fontSize: 9, color: '#b45309', fontWeight: 700 }}>optional</div>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 10, color: '#9aa69e', textAlign: 'center' }}>
          Jede Karte ausschneiden und der jeweiligen Stationsleitung geben · QR/Link + PIN sind vertraulich.
        </div>
      </div>
    </PrintPortal>
  )
}
