import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { supabaseConfigured } from '@/lib/supabase'
import { SetupNotice } from '@/components/SetupNotice'
import { Watermark } from '@/components/Watermark'
import { Spinner } from '@/components/ui'
import { pageVariants } from '@/lib/motion'

const Landing = lazy(() => import('@/pages/Landing'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const Beamer = lazy(() => import('@/pages/Beamer'))
const StationHelper = lazy(() => import('@/pages/StationHelper'))
const Admin = lazy(() => import('@/pages/Admin'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Impressum = lazy(() => import('@/pages/Impressum'))
const Datenschutz = lazy(() => import('@/pages/Datenschutz'))
const Zeitreise = lazy(() => import('@/pages/Zeitreise'))
const Lageplan = lazy(() => import('@/pages/Lageplan'))
const Volleyball = lazy(() => import('@/pages/Volleyball'))
const VolleyLeiter = lazy(() => import('@/pages/VolleyLeiter'))
const QR = lazy(() => import('@/pages/QR'))

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    if (search.includes('stationen=open')) return
    window.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="hidden" animate="show" exit="exit">
        <Suspense fallback={<Loading />}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/rangliste" element={<Leaderboard />} />
            <Route path="/beamer" element={<Beamer />} />
            <Route path="/s/:token" element={<StationHelper />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/zeitreise" element={<Zeitreise />} />
            <Route path="/lageplan" element={<Lageplan />} />
            <Route path="/volleyball" element={<Volleyball />} />
            <Route path="/v/:token" element={<VolleyLeiter />} />
            <Route path="/qr" element={<QR />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  useEffect(() => {
    const preload = () => {
      void import('@/pages/Landing')
      void import('@/pages/Leaderboard')
      void import('@/pages/Volleyball')
      void import('@/pages/Lageplan')
      void import('@/pages/Zeitreise')
      void import('@/pages/Beamer')
      void import('@/pages/QR')
      void import('@/pages/Admin')
    }
    const ric = window.requestIdleCallback
    if (ric) {
      const id = ric(preload)
      return () => window.cancelIdleCallback?.(id)
    }
    const t = window.setTimeout(preload, 600)
    return () => window.clearTimeout(t)
  }, [])

  if (!supabaseConfigured)
    return (
      <>
        <Watermark />
        <SetupNotice />
      </>
    )

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollToTop />
        <Watermark />
        <AnimatedRoutes />
      </BrowserRouter>
    </MotionConfig>
  )
}
