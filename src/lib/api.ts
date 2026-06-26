import { supabase } from './supabase'
import { buildSchedule, computeFinalists, FINALS, VOLLEY_SCHIENEN, type VolleyMatch } from './volley'
import type {
  AuditEntry,
  LeaderboardRow,
  Score,
  StationAdmin,
  StationPublic,
  StationSession,
  Team,
} from './types'

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('sort')
  if (error) throw error
  return data ?? []
}

export async function fetchStationsPublic(): Promise<StationPublic[]> {
  const { data, error } = await supabase.from('stations_public').select('*').order('sort')
  if (error) throw error
  return data ?? []
}

export async function fetchScores(): Promise<Score[]> {
  const { data, error } = await supabase.from('scores').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.from('leaderboard').select('*')
  if (error) throw error
  return data ?? []
}

export type DbHealth = {
  ok: boolean
  db_size_mb?: number
  connections?: number
  cache_hit_ratio?: number
  xact_commit?: number
  xact_rollback?: number
  scores?: number
  teams?: number
  stations_active?: number
  last_score?: string | null
}

export async function fetchDbHealth(): Promise<{ health: DbHealth; latencyMs: number }> {
  const t0 = performance.now()
  const { data, error } = await supabase.rpc('db_health')
  const latencyMs = Math.round(performance.now() - t0)
  if (error) throw error
  return { health: data as DbHealth, latencyMs }
}

export async function getStationPublic(token: string) {
  const { data, error } = await supabase.rpc('get_station_public', { p_token: token })
  if (error) throw error
  return data as { ok: boolean; station?: { id: string; name: string; icon: string; beschreibung: string | null; einheit: string | null } }
}

export async function stationLogin(token: string, pin: string) {
  const { data, error } = await supabase.rpc('station_login', { p_token: token, p_pin: pin })
  if (error) throw error
  return data as ({ ok: true } & StationSession) | { ok: false; error: string }
}

export async function submitScore(args: {
  token: string
  pin: string
  teamId: string
  punkte: number
  helfer?: string | null
  notiz?: string | null
}) {
  const { data, error } = await supabase.rpc('submit_score', {
    p_token: args.token,
    p_pin: args.pin,
    p_team_id: args.teamId,
    p_punkte: args.punkte,
    p_helfer: args.helfer ?? null,
    p_notiz: args.notiz ?? null,
  })
  if (error) throw error
  return data as { ok: boolean; error?: string; alt?: number | null; neu?: number }
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function createTeam(t: Partial<Team>) {
  const { error } = await supabase.from('teams').insert({
    name: t.name,
    jahrgang: t.jahrgang ?? null,
    farbe: t.farbe ?? '#6366f1',
    sort: t.sort ?? 0,
  })
  if (error) throw error
}

export async function updateTeam(id: string, patch: Partial<Team>) {
  const { error } = await supabase.from('teams').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw error
}

export async function fetchStationsAdmin(): Promise<StationAdmin[]> {
  const { data, error } = await supabase.from('stations').select('*').order('sort')
  if (error) throw error
  return data ?? []
}

export async function createStation(s: Partial<StationAdmin>) {
  const { data, error } = await supabase
    .from('stations')
    .insert({
      name: s.name,
      beschreibung: s.beschreibung ?? null,
      icon: s.icon ?? '🏅',
      gewicht: s.gewicht ?? 1,
      einheit: s.einheit ?? 'Punkte',
      sort: s.sort ?? 0,
    })
    .select()
    .single()
  if (error) throw error
  return data as StationAdmin
}

export async function updateStation(id: string, patch: Partial<StationAdmin>) {
  const { error } = await supabase.from('stations').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteStation(id: string) {
  const { error } = await supabase.from('stations').delete().eq('id', id)
  if (error) throw error
}

export async function setStationPin(stationId: string, pin: string | null) {
  const { data, error } = await supabase.rpc('set_station_pin', {
    p_station_id: stationId,
    p_pin: pin,
  })
  if (error) throw error
  return data as { ok: boolean }
}

export async function fetchAudit(limit = 200): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function adminSetScore(stationId: string, teamId: string, punkte: number) {
  const { data: existing } = await supabase
    .from('scores')
    .select('punkte')
    .eq('station_id', stationId)
    .eq('team_id', teamId)
    .maybeSingle()
  const alt = existing?.punkte ?? null

  const { data: userData } = await supabase.auth.getUser()
  const akteur = userData.user?.email ?? 'Admin'

  const { error } = await supabase
    .from('scores')
    .upsert(
      { station_id: stationId, team_id: teamId, punkte, eingetragen_von: akteur, updated_at: new Date().toISOString() },
      { onConflict: 'station_id,team_id' },
    )
  if (error) throw error

  try {
    await supabase.from('audit_log').insert({ station_id: stationId, team_id: teamId, aktion: 'admin_set', alt, neu: punkte, akteur })
  } catch {}
}

let adminPrefetch: Promise<[Team[], StationAdmin[], Score[]]> | null = null

export function prefetchAdminData(): void {
  adminPrefetch = Promise.all([fetchTeams(), fetchStationsAdmin(), fetchScores()])
  adminPrefetch.catch(() => {})
}

export function takeAdminPrefetch(): Promise<[Team[], StationAdmin[], Score[]]> | null {
  const p = adminPrefetch
  adminPrefetch = null
  return p
}

export async function fetchVolleyMatches(): Promise<VolleyMatch[]> {
  const { data, error } = await supabase.from('volley_matches').select('*').order('sort')
  if (error) throw error
  return (data ?? []) as VolleyMatch[]
}

export async function generateVolleySchedule(): Promise<number> {
  const { count } = await supabase.from('volley_matches').select('id', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return 0
  const rows = buildSchedule()
  const { error } = await supabase.from('volley_matches').insert(rows)
  if (error) throw error
  return rows.length
}

export async function setVolleyMatch(
  id: string,
  fields: Partial<Pick<VolleyMatch, 'score_a' | 'score_b' | 'status' | 'team_a' | 'team_b'>>,
): Promise<void> {
  const { error } = await supabase.from('volley_matches').update(fields).eq('id', id)
  if (error) throw error
}

export async function fillVolleyFinals(matches: VolleyMatch[]): Promise<void> {
  for (const s of VOLLEY_SCHIENEN) {
    const fin = computeFinalists(s.schiene, matches)
    for (let i = 0; i < FINALS.length; i++) {
      const row = matches.find((m) => m.phase === 'final' && m.schiene === s.schiene && m.platz === FINALS[i].platz)
      if (!row || !fin[i].a || !fin[i].b) continue
      const { error } = await supabase.from('volley_matches').update({ team_a: fin[i].a, team_b: fin[i].b }).eq('id', row.id)
      if (error) throw error
    }
  }
}

export async function resetVolley(): Promise<void> {
  const { error } = await supabase.from('volley_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
}

export async function fetchVolleyStation(): Promise<{ id: string; token: string; hasPin: boolean } | null> {
  const { data, error } = await supabase.from('stations').select('id, token, pin_hash').eq('name', 'Volleyball-Turnier').maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id as string, token: data.token as string, hasPin: !!data.pin_hash }
}

export async function volleyLogin(token: string, pin: string) {
  const { data, error } = await supabase.rpc('volley_login', { p_token: token, p_pin: pin })
  if (error) throw error
  return data as { ok: boolean; name?: string; error?: string }
}

export async function volleyLeaderSetMatch(
  token: string,
  pin: string,
  id: string,
  scoreA: number | null,
  scoreB: number | null,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('volley_set_match', {
    p_token: token,
    p_pin: pin,
    p_id: id,
    p_score_a: scoreA,
    p_score_b: scoreB,
    p_status: status,
  })
  if (error) throw error
  return data as { ok: boolean; error?: string }
}

export async function volleyLeaderSetTeams(
  token: string,
  pin: string,
  id: string,
  teamA: string,
  teamB: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('volley_set_teams', { p_token: token, p_pin: pin, p_id: id, p_team_a: teamA, p_team_b: teamB })
  if (error) throw error
  return data as { ok: boolean; error?: string }
}
