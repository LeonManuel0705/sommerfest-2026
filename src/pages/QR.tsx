import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'

export default function QR() {
  const [url, setUrl] = useState('')
  useEffect(() => {
    setUrl(window.location.origin)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-8 text-center sm:px-8">
      <div className="w-full max-w-md">
        <img src="/ehg-logo.png" alt="" className="mx-auto h-16 w-16 rounded-2xl bg-white object-contain p-1 ring-1 ring-black/5" />
        <p className="mt-4 label-mono text-xs text-moss-600">Ernst-Haeckel-Gymnasium · 7. Juli 2026</p>
        <h1 className="mt-2 font-display text-4xl text-graphite sm:text-6xl">
          Sommerfest <span className="text-moss-600">2026</span>
        </h1>
        <p className="mt-3 text-lg text-graphite-soft sm:text-xl">Scanne den Code für den Live-Punktestand</p>

        <div className="mx-auto mt-8 w-fit rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-black/10 sm:p-7">
          {url && (
            <div className="w-[min(280px,72vw)]">
              <QRCodeSVG value={url} size={256} level="M" fgColor="#101828" bgColor="#ffffff" className="h-auto w-full" />
            </div>
          )}
        </div>

        <p className="mt-5 break-all text-base font-semibold text-graphite">{url.replace(/^https?:\/\//, '')}</p>

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
