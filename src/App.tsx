import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { supabaseConfigured } from '@/lib/supabase'
import { SetupNotice } from '@/components/SetupNotice'
import { Watermark } from '@/components/Watermark'
import { Spinner } from '@/components/ui'

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
const QR = lazy(() => import('@/pages/QR'))

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}

export default function App() {
  if (!supabaseConfigured)
    return (
      <>
        <Watermark />
        <SetupNotice />
      </>
    )

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Watermark />
      <Suspense fallback={<Loading />}>
        <Routes>
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
          <Route path="/qr" element={<QR />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
