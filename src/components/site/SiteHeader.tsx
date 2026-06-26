import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { OrgaLoginModal } from './OrgaLogin'

export function SiteHeader() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [params, setParams] = useSearchParams()
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious() ?? 0
    if (latest > prev && latest > 90) setHidden(true)
    else if (latest < prev) setHidden(false)
  })

  useEffect(() => {
    if (params.get('login') === '1') {
      setLoginOpen(true)
      const next = new URLSearchParams(params)
      next.delete('login')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.header
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-40 border-b border-graphite/[0.06] bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/ehg-logo.png" alt="EHG" className="h-9 w-9 rounded-xl bg-white object-contain p-0.5 ring-1 ring-black/5" />
          <span className="font-semibold tracking-tight text-graphite">Sommerfest 2026</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] font-medium text-graphite-soft md:flex">
          <a href="/#stationen" className="transition hover:text-graphite">Stationen</a>
          <Link to="/rangliste" className="transition hover:text-graphite">Scoreboard</Link>
          <Link to="/beamer" className="transition hover:text-graphite">Beamer</Link>
        </nav>

        <button
          onClick={() => setLoginOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-moss-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(0,128,55,0.7)] transition hover:bg-moss-700"
        >
          <ShieldCheck className="h-4 w-4" /> Orga-Login
        </button>
      </div>

      <OrgaLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </motion.header>
  )
}
