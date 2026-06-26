import { Link } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import { ArrowLeft } from 'lucide-react'
import errorAnim from '@/assets/lottie/error-404.json'

export default function NotFound() {
  const { View } = useLottie({ animationData: errorAnim, loop: true, autoplay: true }, { width: 'min(88vw, 480px)' })

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-10 text-center">
      <div className="w-full max-w-md">
        <div className="flex justify-center">{View}</div>
        <p className="mt-2 text-graphite-soft">Diese Seite gibt's nicht — aber das Sommerfest schon.</p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(0,128,55,0.6)] transition hover:bg-moss-700"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Startseite
        </Link>
      </div>
    </div>
  )
}
