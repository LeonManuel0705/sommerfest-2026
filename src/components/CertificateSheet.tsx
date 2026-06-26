import { PrintPortal } from './PrintPortal'

export type Cert = {
  seal: string
  title: string
  context: string
  name: string
  points: number
  accent: string
  farbe: string
}

const display = "'Playfair Display', Georgia, serif"
const nf = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

export function CertificateSheet({ certs }: { certs: Cert[] }) {
  const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  if (certs.length === 0) return null

  return (
    <PrintPortal page="cert">
      {certs.map((c, i) => (
        <div
          key={i}
          className="cert-page"
          style={{
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
            boxSizing: 'border-box',
            width: '100%',
            height: '296mm',
            overflow: 'hidden',
            padding: '6mm',
            fontFamily: 'var(--font-sans)',
            color: '#1b2620',
            background: '#fff',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', border: `2.5px solid ${c.accent}`, borderRadius: 6 }}>
            <div style={{ position: 'absolute', inset: 9, border: `1px solid ${c.accent}`, opacity: 0.45, borderRadius: 3, pointerEvents: 'none' }} />

            <img
              src="/ehg-logo.png"
              alt=""
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '58%', opacity: 0.045, filter: 'grayscale(1)' }}
            />

            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '15mm 20mm' }}>
              <img src="/ehg-logo.png" alt="" style={{ height: 60, width: 'auto' }} />
              <div style={{ marginTop: 12, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#5a6b61', fontWeight: 600 }}>
                Ernst-Haeckel-Gymnasium Werder (Havel)
              </div>

              <div style={{ fontFamily: display, fontSize: 72, letterSpacing: '0.14em', fontWeight: 700, marginTop: 26, color: '#14201a', lineHeight: 1 }}>
                Urkunde
              </div>
              <Divider accent={c.accent} />

              <div style={{ marginTop: 32, fontSize: 16, color: '#5a6b61', fontStyle: 'italic' }}>wird verliehen an die Klasse</div>

              <div style={{ marginTop: 10, fontFamily: display, fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.01em', color: '#13201a' }}>{c.name}</div>

              <Seal accent={c.accent} text={c.seal} />

              <div style={{ fontFamily: display, fontSize: 32, fontWeight: 700, color: c.accent, marginTop: 6 }}>{c.title}</div>
              <div style={{ marginTop: 8, fontSize: 15, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#7a8a80', fontWeight: 600 }}>{c.context}</div>

              <div style={{ marginTop: 22, fontSize: 18, color: '#3a463f' }}>
                erreicht mit <span style={{ fontFamily: display, fontWeight: 800, color: c.accent, fontSize: 24, fontVariantNumeric: 'tabular-nums' }}>{nf.format(c.points)}</span> Punkten
              </div>

              <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 30 }}>
                <Sign label="Schulleitung" />
                <div style={{ textAlign: 'center', fontSize: 13, color: '#7a8a80' }}>
                  Werder (Havel), {date}
                  <div style={{ marginTop: 4, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9aa69e' }}>Sommerfest 2026</div>
                </div>
                <Sign label="Sommerfest-Orga" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </PrintPortal>
  )
}

function Divider({ accent }: { accent: string }) {
  return (
    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 72, height: 1.5, background: accent, opacity: 0.55, display: 'inline-block' }} />
      <span style={{ width: 9, height: 9, transform: 'rotate(45deg)', background: accent, display: 'inline-block' }} />
      <span style={{ width: 72, height: 1.5, background: accent, opacity: 0.55, display: 'inline-block' }} />
    </div>
  )
}

function Seal({ accent, text }: { accent: string; text: string }) {
  const scallops = Array.from({ length: 22 }, (_, k) => {
    const a = (k / 22) * Math.PI * 2
    return { x: 60 + Math.cos(a) * 43, y: 56 + Math.sin(a) * 43 }
  })
  return (
    <svg width="138" height="178" viewBox="0 0 120 152" style={{ marginTop: 22 }}>
      <path d="M46 92 L36 148 L54 134 L60 150 Z" fill={accent} opacity="0.85" />
      <path d="M74 92 L84 148 L66 134 L60 150 Z" fill={accent} opacity="0.7" />
      {scallops.map((p, k) => (
        <circle key={k} cx={p.x} cy={p.y} r="7.5" fill={accent} opacity="0.22" />
      ))}
      <circle cx="60" cy="56" r="41" fill="#fff" stroke={accent} strokeWidth="2" />
      <circle cx="60" cy="56" r="33" fill={accent} />
      <circle cx="60" cy="56" r="33" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.55" />
      <text x="60" y="57" textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif" fontSize="32" fontWeight="700" fill="#fff">
        {text}
      </text>
    </svg>
  )
}

function Sign({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', width: 200 }}>
      <div style={{ height: 1, background: '#c4cdc6', marginBottom: 7 }} />
      <div style={{ fontSize: 13, color: '#5a6b61', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}
