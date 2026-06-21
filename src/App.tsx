import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
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
      <Watermark />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/rangliste" element={<Leaderboard />} />
          <Route path="/beamer" element={<Beamer />} />
          <Route path="/s/:token" element={<StationHelper />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
