import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { fetchSettings } from './api'

export function useScoreboardFrozen(): boolean {
  const [frozen, setFrozen] = useState(false)
  useEffect(() => {
    let alive = true
    const load = () =>
      fetchSettings()
        .then((s) => alive && setFrozen(s.scoreboard_frozen))
        .catch(() => {})
    load()
    const ch = supabase
      .channel('public-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, load)
      .subscribe()
    const id = window.setInterval(load, 15000)
    return () => {
      alive = false
      supabase.removeChannel(ch)
      window.clearInterval(id)
    }
  }, [])
  return frozen
}
