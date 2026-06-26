import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { useLottie } from 'lottie-react'
import { Lock, Mail, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { prefetchAdminData, signIn } from '@/lib/api'
import { cx } from '@/lib/format'
import lockAnim from '@/assets/lottie/lock-green-tick.json'
import failureAnim from '@/assets/lottie/failure-error.json'

export const GLASS: React.CSSProperties = {
  background: 'linear-gradient(155deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
  backdropFilter: 'blur(3px) saturate(140%)',
  WebkitBackdropFilter: 'blur(3px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow:
    '0 30px 60px -28px rgba(28,58,108,0.4), 0 10px 26px -16px rgba(28,58,108,0.22), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 0 0 1px rgba(255,255,255,0.07)',
}

const GLASS_MODAL: React.CSSProperties = {
  background: 'linear-gradient(155deg, rgba(255,255,255,0.58), rgba(255,255,255,0.36))',
  backdropFilter: 'blur(24px) saturate(185%)',
  WebkitBackdropFilter: 'blur(24px) saturate(185%)',
  border: '1px solid rgba(255,255,255,0.65)',
  boxShadow:
    '0 44px 90px -34px rgba(15,23,42,0.6), 0 12px 30px -18px rgba(15,23,42,0.35), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.22)',
}

export function TopGloss() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-14"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.24), transparent)' }}
    />
  )
}

function Field({
  icon: Icon,
  value,
  onChange,
  ...props
}: {
  icon: LucideIcon
  value: string
  onChange: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[54px] w-full rounded-2xl border border-white/60 bg-white/45 pr-4 pl-12 text-base font-medium text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-sky-300 focus:bg-white/85 focus:ring-4 focus:ring-sky-400/25 disabled:opacity-60"
        {...props}
      />
    </div>
  )
}

export function OrgaLoginCard({ onSuccess, onAuthenticated, bottom }: { onSuccess: () => void; onAuthenticated?: () => void; bottom?: React.ReactNode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<'lock' | 'error'>('lock')
  const successRef = useRef(false)
  const errTimer = useRef<number | undefined>(undefined)

  const lock = useLottie(
    {
      animationData: lockAnim,
      autoplay: false,
      loop: false,
      onComplete: () => {
        if (successRef.current) onSuccess()
      },
    },
    { width: 88, height: 88 },
  )
  const errLock = useLottie({ animationData: failureAnim, autoplay: false, loop: false }, { width: 88, height: 88 })

  useEffect(() => {
    lock.setSpeed(2)
    lock.goToAndStop(37, true)
    errLock.goToAndStop(0, true)
    return () => window.clearTimeout(errTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const px = useMotionValue(50)
  const py = useMotionValue(38)
  const sx = useSpring(px, { stiffness: 120, damping: 20 })
  const sy = useSpring(py, { stiffness: 120, damping: 20 })
  const sheen = useMotionTemplate`radial-gradient(440px circle at ${sx}% ${sy}%, rgba(255,255,255,0.5), transparent 62%)`
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 100)
    py.set(((e.clientY - r.top) / r.height) * 100)
  }
  const onLeave = () => {
    px.set(50)
    py.set(38)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
      successRef.current = true
      setSuccess(true)
      onAuthenticated?.()
      prefetchAdminData()
      void import('@/pages/Admin')
      lock.setSpeed(1.7)
      lock.playSegments([37, 141], true)
    } catch {
      setError('Login fehlgeschlagen. E-Mail oder Passwort falsch.')
      setBusy(false)
      setMode('error')
      errLock.goToAndStop(0, true)
      errLock.playSegments([0, 41], true)
      window.clearTimeout(errTimer.current)
      errTimer.current = window.setTimeout(() => {
        setMode('lock')
        lock.goToAndStop(37, true)
      }, 1700)
    }
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.55), transparent 65%)' }}
      />
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 90, damping: 17 }}
        className="relative w-[min(92vw,450px)] overflow-hidden rounded-[32px] p-8 sm:p-10"
        style={GLASS_MODAL}
      >
        <TopGloss />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60" style={{ background: sheen }} />

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-white/70"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(255,255,255,0.26))',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            boxShadow: 'inset 0 1px 6px rgba(255,255,255,0.9), inset 0 -8px 16px -10px rgba(40,70,120,0.3), 0 16px 30px -14px rgba(30,64,110,0.4)',
          }}
        >
          <div className="relative h-[88px] w-[88px]">
            <div className={cx('absolute inset-0 transition-opacity duration-200', mode === 'error' ? 'opacity-0' : 'opacity-100')}>{lock.View}</div>
            <div className={cx('absolute inset-0 transition-opacity duration-200', mode === 'error' ? 'opacity-100' : 'opacity-0')}>{errLock.View}</div>
          </div>
        </motion.div>

        <h1 className="mt-6 text-center text-[26px] font-bold tracking-tight text-slate-800">Orga-Login</h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">Nur fürs Sommerfest-Team.</p>

        <form onSubmit={submit} className="mt-7 space-y-3.5">
          <div className="flex min-h-[20px] items-center justify-center px-1">
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-center text-sm font-semibold text-rose-500"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <Field icon={Mail} type="email" placeholder="E-Mail-Adresse" value={email} onChange={setEmail} autoComplete="email" disabled={success} />
          <Field icon={Lock} type="password" placeholder="Passwort" value={password} onChange={setPassword} autoComplete="current-password" disabled={success} />
          <motion.button
            type="submit"
            disabled={busy}
            whileHover={busy ? undefined : { y: -2 }}
            whileTap={busy ? undefined : { scale: 0.97 }}
            className="sheen mt-1 h-[54px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-[15px] font-semibold text-white shadow-[0_14px_30px_-10px_rgba(5,150,105,0.6),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-8px_16px_-10px_rgba(2,80,55,0.6)] transition-colors hover:from-emerald-500 hover:to-emerald-700 disabled:opacity-70"
          >
            {success ? 'Entsperrt…' : busy ? 'Anmelden…' : 'Anmelden'}
          </motion.button>
        </form>

        {bottom && <div className="mt-5">{bottom}</div>}
      </motion.div>
    </div>
  )
}

export function OrgaLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto py-6 px-4"
          style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/18"
            onClick={onClose}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <OrgaLoginCard
              onSuccess={() => {
                onClose()
                navigate('/admin')
              }}
              bottom={
                <button onClick={onClose} className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700">
                  <X className="h-4 w-4" /> Abbrechen
                </button>
              }
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
