import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { fetchLeaderboard, fetchScores, fetchStationsPublic, fetchTeams } from './api'
import { computeLeaderboard } from './format'
import type { LeaderboardRow, Score, StationPublic, Team } from './types'

type State = {
  teams: Team[]
  stations: StationPublic[]
  scores: Score[]
  polled: LeaderboardRow[] | null
  loading: boolean
  error: string | null
  live: boolean
}

const sortLb = (rows: LeaderboardRow[]) =>
  [...rows].sort((a, b) => b.gesamt - a.gesamt || a.name.localeCompare(b.name, 'de'))

export function useLiveData(opts?: { realtime?: boolean; pollMs?: number }) {
  const realtime = opts?.realtime ?? true
  const pollMs = opts?.pollMs ?? 5000

  const [state, setState] = useState<State>({
    teams: [],
    stations: [],
    scores: [],
    polled: null,
    loading: true,
    error: null,
    live: false,
  })
  const mounted = useRef(true)

  const loadAll = useCallback(async () => {
    try {
      const [teams, stations, scores] = await Promise.all([fetchTeams(), fetchStationsPublic(), fetchScores()])
      if (!mounted.current) return
      setState((s) => ({ ...s, teams, stations, scores, loading: false, error: null }))
    } catch (e) {
      if (!mounted.current) return
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }))
    }
  }, [])

  const reloadScores = useCallback(async () => {
    try {
      const scores = await fetchScores()
      if (mounted.current) setState((s) => ({ ...s, scores }))
    } catch {
    }
  }, [])

  const reloadTeams = useCallback(async () => {
    try {
      const teams = await fetchTeams()
      if (mounted.current) setState((s) => ({ ...s, teams }))
    } catch {
    }
  }, [])

  const loadLeaderboard = useCallback(async () => {
    try {
      const lb = await fetchLeaderboard()
      if (mounted.current) setState((s) => ({ ...s, polled: sortLb(lb), live: true, loading: false, error: null }))
    } catch (e) {
      if (mounted.current)
        setState((s) => (s.polled === null ? { ...s, loading: false, error: (e as Error).message, live: false } : s))
    }
  }, [])

  const loadPublicMeta = useCallback(async () => {
    try {
      const stations = await fetchStationsPublic()
      if (mounted.current) setState((s) => ({ ...s, stations }))
    } catch {
    }
  }, [])

  useEffect(() => {
    mounted.current = true

    if (!realtime) {
      loadPublicMeta()
      loadLeaderboard()
      const id = window.setInterval(loadLeaderboard, pollMs)
      const onFocus = () => loadLeaderboard()
      window.addEventListener('focus', onFocus)
      return () => {
        mounted.current = false
        window.clearInterval(id)
        window.removeEventListener('focus', onFocus)
      }
    }

    loadAll()
    let subscribedOnce = false
    const channel = supabase
      .channel('live-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, reloadScores)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, reloadTeams)
      .subscribe((status) => {
        if (!mounted.current) return
        setState((s) => ({ ...s, live: status === 'SUBSCRIBED' }))
        if (status === 'SUBSCRIBED') {
          if (subscribedOnce) loadAll()
          subscribedOnce = true
        }
      })

    const safetyId = window.setInterval(loadAll, 30000)
    const onFocus = () => loadAll()
    window.addEventListener('focus', onFocus)

    return () => {
      mounted.current = false
      window.clearInterval(safetyId)
      window.removeEventListener('focus', onFocus)
      supabase.removeChannel(channel)
    }
  }, [realtime, pollMs, loadAll, reloadScores, reloadTeams, loadLeaderboard, loadPublicMeta])

  const computed = useMemo(
    () => computeLeaderboard(state.teams, state.stations, state.scores),
    [state.teams, state.stations, state.scores],
  )
  const leaderboard = realtime ? computed : state.polled ?? []

  const scoreMap = useMemo(() => {
    const m = new Map<string, Score>()
    for (const s of state.scores) m.set(`${s.station_id}:${s.team_id}`, s)
    return m
  }, [state.scores])

  return { ...state, leaderboard, scoreMap, reload: realtime ? loadAll : loadLeaderboard }
}
