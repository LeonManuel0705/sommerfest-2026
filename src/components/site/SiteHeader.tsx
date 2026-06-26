import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { cx } from '@/lib/format'
import { OrgaLoginModal } from './OrgaLogin'

type NavItem = { label: string; to?: string; href?: string }
const NAV: NavItem[] = [
  { label: 'Stationen', href: '/?stationen=open' },
  { label: 'Volleyball', to: '/volleyball' },
  { label: 'Lageplan', to: '/lageplan' },
  { label: 'Zeitreise', to: '/zeitreise' },
  { label: 'Scoreboard', to: '/rangliste' },
]

export function SiteHeader() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
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

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const isActive = (item: NavItem) => !!item.to && pathname === item.to

  const goHome = () => {
    setMenuOpen(false)
    if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goStationen = () => {
    setMenuOpen(false)
    navigate('/?stationen=open')
  }

  const openLogin = () => {
    setMenuOpen(false)
    setLoginOpen(true)
  }

  const selectItem = (item: NavItem) => {
    if (pending) return
    setPending(item.label)
    window.setTimeout(() => {
      setMenuOpen(false)
      setPending(null)
      if (item.to) navigate(item.to)
      else navigate('/?stationen=open')
    }, 220)
  }

  return (
    <motion.header
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-40 border-b border-graphite/[0.06] bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          to="/"
          onClick={goHome}
          aria-label="Zur Startseite"
          className="-m-1 flex items-center gap-2.5 rounded-2xl p-1 transition hover:opacity-90 active:scale-[0.97]"
        >
          <img src="/ehg-logo.png" alt="EHG" className="h-9 w-9 rounded-xl bg-white object-contain p-0.5 ring-1 ring-black/5" />
          <span className="font-semibold tracking-tight text-graphite">Sommerfest 2026</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[15px] font-medium lg:flex">
          {NAV.map((item) => {
            const active = isActive(item)
            const className = cx('transition', active ? 'font-semibold text-moss-700' : 'text-graphite-soft hover:text-graphite')
            return item.to ? (
              <Link key={item.label} to={item.to} className={className}>
                {item.label}
              </Link>
            ) : (
              <button key={item.label} onClick={goStationen} className={className}>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={openLogin}
            className="hidden items-center gap-1.5 rounded-full bg-moss-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(0,128,55,0.7)] transition hover:bg-moss-700 lg:inline-flex"
          >
            <ShieldCheck className="h-4 w-4" /> Orga-Login
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Menü öffnen"
            className="grid h-11 w-11 place-items-center rounded-full text-graphite transition hover:bg-graphite/[0.05] lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {menuOpen && (
            <div className="lg:hidden">
              <motion.button
                aria-label="Menü schließen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-md"
              />
              <motion.nav
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="fixed inset-x-0 top-0 z-50 rounded-b-[2rem] border-b border-graphite/[0.06] bg-white/90 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
              >
                <div className="flex h-16 items-center justify-between">
                  <span className="font-semibold tracking-tight text-graphite">Menü</span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    aria-label="Menü schließen"
                    className="grid h-11 w-11 place-items-center rounded-full text-graphite transition hover:bg-graphite/[0.05]"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {NAV.map((item, i) => {
                    const active = isActive(item)
                    const isPending = pending === item.label
                    return (
                      <motion.div key={item.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 + i * 0.05 }}>
                        <Link
                          to={item.to ?? item.href ?? '/'}
                          onClick={(e) => {
                            e.preventDefault()
                            selectItem(item)
                          }}
                          aria-current={active ? 'page' : undefined}
                          className={cx(
                            'flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg transition active:scale-[0.98]',
                            isPending
                              ? 'bg-moss-600 font-bold text-white'
                              : active
                                ? 'bg-moss-500/10 font-bold text-graphite'
                                : 'font-medium text-graphite-soft hover:bg-graphite/[0.04] hover:text-graphite',
                          )}
                        >
                          <span>{item.label}</span>
                          {isPending ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          ) : active ? (
                            <span className="h-2 w-2 rounded-full bg-moss-500" />
                          ) : null}
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
                <button
                  onClick={openLogin}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-moss-600 px-4 py-3.5 text-base font-semibold text-white shadow-[0_8px_20px_-10px_rgba(0,128,55,0.7)] transition hover:bg-moss-700"
                >
                  <ShieldCheck className="h-4 w-4" /> Orga-Login
                </button>
              </motion.nav>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <OrgaLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </motion.header>
  )
}
