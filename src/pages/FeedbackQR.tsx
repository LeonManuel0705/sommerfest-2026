import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GitBranch, Lock, Printer, Timer } from 'lucide-react'
import { PrintPortal } from '@/components/PrintPortal'

export default function FeedbackQR() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}/feedback`)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-8 text-center sm:px-8">
      <div className="w-full max-w-md">
        <img src="/ehg-logo.png" alt="" className="mx-auto h-16 w-16 rounded-2xl bg-white object-contain p-1 ring-1 ring-black/5" />
        <p className="mt-4 label-mono text-xs text-moss-600">Sommerfest 2026 · Ernst-Haeckel-Gymnasium</p>
        <h1 className="mt-2 font-display text-5xl text-graphite sm:text-7xl">
          Wie <span className="text-moss-600">war&apos;s</span>?
        </h1>
        <p className="mt-3 text-lg text-graphite-soft sm:text-xl">Scannt den Code und sagt&apos;s uns ehrlich</p>

        <div className="mx-auto mt-8 w-fit rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-black/10 sm:p-7">
          {url && (
            <div className="w-[min(280px,72vw)]">
              <QRCodeSVG value={url} size={256} level="M" fgColor="#101828" bgColor="#ffffff" className="h-auto w-full" />
            </div>
          )}
        </div>

        <p className="mt-5 break-all text-base font-semibold text-graphite">{url.replace(/^https?:\/\//, '')}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-graphite-soft">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-moss-600" /> Anonym
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-moss-600" /> 90 Sekunden
          </span>
        </div>

        <div className="mt-10">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3 text-[15px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(0,128,55,0.6)] transition hover:bg-moss-700"
          >
            <Printer className="h-4 w-4" /> Plakat drucken
          </button>
        </div>
      </div>

      <PrintPortal>
        <div className="flex min-h-[277mm] flex-col items-center justify-center bg-white px-[20mm] py-[16mm] text-center text-black">
          <img src="/ehg-logo.png" alt="" className="h-20 w-20 object-contain" />
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em]">Sommerfest 2026 · Ernst-Haeckel-Gymnasium</p>
          <h1 className="mt-3 font-display text-7xl font-bold">Wie war&apos;s?</h1>
          <p className="mt-4 text-2xl">Scannt den Code und sagt&apos;s uns ehrlich</p>
          {url && (
            <div className="mt-10 rounded-3xl border-2 border-black/15 p-8">
              <QRCodeSVG value={url} size={340} level="M" fgColor="#000000" bgColor="#ffffff" />
            </div>
          )}
          <p className="mt-6 text-xl font-bold">{url.replace(/^https?:\/\//, '')}</p>
          <div className="mt-8 flex items-center gap-8 text-base">
            <span className="inline-flex items-center gap-2">
              <Lock className="h-5 w-5" /> Anonym
            </span>
            <span className="inline-flex items-center gap-2">
              <Timer className="h-5 w-5" /> 90 Sekunden
            </span>
            <span className="inline-flex items-center gap-2">
              <GitBranch className="h-5 w-5" /> Fragen passen sich dir an
            </span>
          </div>
          <p className="mt-10 text-sm text-black/50">Euer Feedback entscheidet, wie das Sommerfest 2027 wird.</p>
        </div>
      </PrintPortal>
    </div>
  )
}
