import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, MonitorPlay, ShieldCheck } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { InkBackground } from '@/components/InkBackground'
import { FireBars } from '@/components/FireBars'
import { LivePill } from '@/components/ui'
import { useLiveData } from '@/lib/useLiveData'
import { spring } from '@/lib/motion'

const reveal = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 90, damping: 18 } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
const ascendEase = [0.6, 0, 0.2, 1] as const

export default function Landing() {
  const { leaderboard, live } = useLiveData({ realtime: false, pollMs: 8000 })
  const navigate = useNavigate()
  const [ascending, setAscending] = useState(false)
  const top = leaderboard.slice(0, 12)

  const ascend = () => {
    if (ascending) return
    setAscending(true)
    window.setTimeout(() => navigate('/admin'), 1180)
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <InkBackground />

      <AnimatePresence>
        {ascending && (
          <>
            <motion.div
              key="sky"
              className="pointer-events-none fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ backgroundImage: 'url(/sky.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            <motion.div
              key="deck"
              aria-hidden
              className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
              initial={{ y: '0%', opacity: 0 }}
              animate={{ y: ['0%', '0%', '118%'], opacity: [0, 1, 1] }}
              transition={{ duration: 1.2, times: [0, 0.18, 1], ease: ascendEase }}
            >
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, #fbfdff 0%, #fbfdff 56%, rgba(251,253,255,0.88) 74%, rgba(251,253,255,0) 100%)' }}
              />
              <img src="/clouds-cut.png" alt="" className="absolute bottom-[-3%] left-[-18%] w-[136%] max-w-none" />
              <img src="/clouds-cut.png" alt="" className="absolute bottom-[5%] left-[-28%] w-[164%] max-w-none opacity-90" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        animate={ascending ? { opacity: 0, scale: 0.98, filter: 'blur(4px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: ascendEase }}
        className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-6 sm:px-8"
      >
        <header className="flex items-center justify-between">
          <Brand />
          <button
            onClick={ascend}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-graphite-soft transition hover:text-graphite"
          >
            <ShieldCheck className="h-4 w-4" /> Orga-Login
          </button>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col items-center">
            <motion.p variants={reveal} className="eyebrow mb-5 text-sm text-moss-600">
              Sportfest 2026 · Ernst-Haeckel-Gymnasium
            </motion.p>
            <motion.h1
              variants={reveal}
              className="text-balance text-6xl font-bold leading-[0.95] tracking-tight text-graphite sm:text-7xl lg:text-8xl"
            >
              Jeder Punkt <span className="text-gradient">zählt.</span>
            </motion.h1>
            <motion.p variants={reveal} className="mt-6 max-w-xl text-lg leading-relaxed text-graphite-soft">
              Live-Wertung für unser Sportfest. Helfer tragen an ihren Stationen ein — und die ganze
              Schule sieht zu, wie die Klassen nach oben schießen.
            </motion.p>
            <motion.div variants={reveal} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/rangliste"
                className="sheen inline-flex items-center gap-2 rounded-full bg-moss-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(5,150,105,0.6)] transition hover:bg-moss-700"
              >
                Zum Live-Scoreboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/beamer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3.5 text-[15px] font-semibold text-graphite hairline shadow-sm transition hover:bg-paper-2"
              >
                <MonitorPlay className="h-4 w-4 text-moss-600" /> Beamer-Modus
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring, delay: 0.25 }}
            className="glass mt-14 w-full overflow-hidden rounded-3xl p-5 sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="eyebrow text-xs text-moss-600">Live · Spitzenfeld</span>
              <LivePill live={live} />
            </div>
            {top.length > 0 ? (
              <FireBars rows={top} chartH={230} />
            ) : (
              <div className="py-16 text-center text-sm text-graphite-soft">Sobald Punkte eingetragen werden, wächst es hier los.</div>
            )}
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}
