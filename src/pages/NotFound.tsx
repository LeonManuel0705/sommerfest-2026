import { Link } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import { ArrowLeft } from 'lucide-react'
import { InkBackground } from '@/components/InkBackground'
import catAnim from '@/assets/lottie/not-found-cat.json'

export default function NotFound() {
  const { View } = useLottie({ animationData: catAnim, loop: true, autoplay: true }, { width: 'min(86vw, 440px)' })

  return (
    <div className="relative grid min-h-dvh place-items-center px-6 py-10 text-center">
      <InkBackground />
      <div className="flex flex-col items-center">
        {View}
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-graphite">Hier ist nichts… außer der Katze.</h1>
        <p className="mt-3 max-w-md text-graphite-soft">Diese Seite gibt's nicht. Aber das Sportfest schon — geht's hier weiter.</p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(5,150,105,0.6)] transition hover:bg-moss-700"
        >
          <ArrowLeft className="h-4 w-4" /> Zur Startseite
        </Link>
      </div>
    </div>
  )
}
