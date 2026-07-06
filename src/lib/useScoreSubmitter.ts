import { useCallback, useEffect, useRef, useState } from 'react'
import { submitScore } from './api'

type Pending = Record<string, { punkte: number; ts: number }>
type Status = 'idle' | 'sending' | 'queued' | 'error'

const keyFor = (token: string) => `sportfest_pending_${token}`

function load(token: string): Pending {
  try {
    return JSON.parse(localStorage.getItem(keyFor(token)) ?? '{}')
  } catch {
    return {}
  }
}
function persist(token: string, p: Pending) {
  try {
    localStorage.setItem(keyFor(token), JSON.stringify(p))
  } catch {
  }
}

export function useScoreSubmitter(opts: {
  token: string
  pin: string
  helfer: string | null
  onConfirmed?: (teamId: string, punkte: number) => void
}) {
  const { token, pin, helfer, onConfirmed } = opts
  const [pending, setPending] = useState<Pending>(() => load(token))
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [online, setOnline] = useState(navigator.onLine)
  const [pinError, setPinError] = useState(false)
  const flushing = useRef(false)
  const confirmRef = useRef(onConfirmed)
  confirmRef.current = onConfirmed

  const setOne = (teamId: string, s: Status) =>
    setStatus((prev) => ({ ...prev, [teamId]: s }))

  const flush = useCallback(async () => {
    if (flushing.current || !navigator.onLine || !pin) return
    flushing.current = true
    try {
      const current = load(token)
      for (const [teamId, item] of Object.entries(current)) {
        setOne(teamId, 'sending')
        try {
          const res = await submitScore({ token, pin, teamId, punkte: item.punkte, helfer })
          if (res.ok) {
            setPinError(false)
            const next = load(token)
            if (next[teamId]?.ts === item.ts) {
              delete next[teamId]
              persist(token, next)
              setPending({ ...next })
            }
            setOne(teamId, 'idle')
            confirmRef.current?.(teamId, item.punkte)
          } else if (res.error === 'wrong_pin') {
            setPinError(true)
            setOne(teamId, 'error')
            break
          } else if (res.error === 'locked') {
            setOne(teamId, 'queued')
            break
          } else {
            setOne(teamId, 'error')
          }
        } catch {
          setOne(teamId, 'queued')
        }
      }
    } finally {
      flushing.current = false
    }
  }, [token, pin, helfer])

  const submit = useCallback(
    (teamId: string, punkte: number) => {
      const next = load(token)
      next[teamId] = { punkte, ts: Date.now() }
      persist(token, next)
      setPending({ ...next })
      setOne(teamId, navigator.onLine ? 'sending' : 'queued')
      void flush()
    },
    [token, flush],
  )

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      void flush()
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    const interval = setInterval(() => void flush(), 8000)
    void flush()
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      clearInterval(interval)
    }
  }, [flush])

  const pendingCount = Object.keys(pending).length

  return { submit, pending, status, online, pendingCount, pinError, retry: flush }
}
