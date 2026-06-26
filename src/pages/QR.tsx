import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'

export default function QR() {
  const [url, setUrl] = useState('')
  useEffect(() => {
    setUrl(window.location.origin)
  }, [])

  return (
    <div className="grid min-h-dvh place-items-center bg-white p-8 text-center">
      <div className="flex flex-col items-center">
        <img src="/ehg-logo.png" alt="" className="h-16 w-16 rounded-2xl bg-white object-contain p-1 ring-1 ring-black/5" />
        <p className="mt-4 label-mono text-xs text-moss-600">Ernst-Haeckel-Gymnasium · 7. Juli 2026</p>
        <h1 className="mt-2 font-display text-5xl text-graphite sm:text-6xl">
          Sommerfest <span className="text-moss-600">2026</span>
        </h1>
        <p className="mt-3 text-xl text-graphite-soft">Scanne den Code für den Live-Punktestand</p>

        <div className="mt-8 rounded-[2rem] bg-white p-7 shadow-card ring-1 ring-black/10">
          {url && <QRCodeSVG value={url} size={300} level="M" fgColor="#101828" bgColor="#ffffff" />}
        </div>

        <p className="mt-5 text-base font-semibold text-graphite">{url.replace(/^https?:\/\//, '')}</p>

        <button
          onClick={() => window.print()}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3 text-[15px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(0,128,55,0.6)] transition hover:bg-moss-700 print:hidden"
        >
          <Printer className="h-4 w-4" /> Plakat drucken
        </button>
      </div>
    </div>
  )
}
