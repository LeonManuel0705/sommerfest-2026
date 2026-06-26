export type VolleyMatch = {
  id: string
  schiene: number
  gruppe: string
  team_a: string
  team_b: string
  score_a: number | null
  score_b: number | null
  status: 'geplant' | 'live' | 'fertig'
  phase: 'gruppe' | 'final'
  platz: number | null
  sort: number
}

export const VOLLEY_SCHIENEN = [
  {
    schiene: 1,
    label: 'Schiene 1 · Klassen 7 & 8',
    zeit: '08:40 – 10:25 Uhr',
    gruppen: { A: ['7a', '7c', '7s', '8a', '8c'], B: ['7b', '7d', '8b', '8s'] } as Record<string, string[]>,
  },
  {
    schiene: 2,
    label: 'Schiene 2 · Klassen 9 & 10',
    zeit: '10:50 – 12:50 Uhr',
    gruppen: { A: ['9b', '9d', '10a', '10c', '10s'], B: ['9a', '9c', '9s', '10b', '10d'] } as Record<string, string[]>,
  },
]

export const FINALS = [
  { platz: 1, rank: 0, titel: 'Finale', sub: 'um Platz 1' },
  { platz: 3, rank: 1, titel: 'Kleines Finale', sub: 'um Platz 3' },
  { platz: 5, rank: 2, titel: 'Platzierungsspiel', sub: 'um Platz 5' },
]

export type Standing = {
  team: string
  spiele: number
  siege: number
  niederlagen: number
  erzielt: number
  kassiert: number
  diff: number
  punkte: number
}

export function computeStandings(teams: string[], matches: VolleyMatch[]): Standing[] {
  const map = new Map<string, Standing>(
    teams.map((t) => [t, { team: t, spiele: 0, siege: 0, niederlagen: 0, erzielt: 0, kassiert: 0, diff: 0, punkte: 0 }]),
  )
  for (const m of matches) {
    if (m.status !== 'fertig' || m.score_a == null || m.score_b == null) continue
    const a = map.get(m.team_a)
    const b = map.get(m.team_b)
    if (!a || !b) continue
    a.spiele++
    b.spiele++
    a.erzielt += m.score_a
    a.kassiert += m.score_b
    b.erzielt += m.score_b
    b.kassiert += m.score_a
    if (m.score_a > m.score_b) {
      a.siege++
      b.niederlagen++
      a.punkte += 2
      b.punkte += 1
    } else if (m.score_b > m.score_a) {
      b.siege++
      a.niederlagen++
      b.punkte += 2
      a.punkte += 1
    } else {
      a.punkte++
      b.punkte++
    }
  }
  for (const s of map.values()) s.diff = s.erzielt - s.kassiert
  return [...map.values()].sort(
    (x, y) => y.punkte - x.punkte || y.diff - x.diff || y.erzielt - x.erzielt || x.team.localeCompare(y.team, 'de'),
  )
}

export function roundRobinPairs(teams: string[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) pairs.push([teams[i], teams[j]])
  }
  return pairs
}

export function groupMatches(schiene: number, gruppe: string, matches: VolleyMatch[]): VolleyMatch[] {
  return matches.filter((m) => m.phase === 'gruppe' && m.schiene === schiene && m.gruppe === gruppe)
}

export function computeFinalists(schiene: number, matches: VolleyMatch[]): { a: string; b: string }[] {
  const s = VOLLEY_SCHIENEN.find((x) => x.schiene === schiene)
  if (!s) return FINALS.map(() => ({ a: '', b: '' }))
  const standA = computeStandings(s.gruppen.A, groupMatches(schiene, 'A', matches))
  const standB = computeStandings(s.gruppen.B, groupMatches(schiene, 'B', matches))
  return FINALS.map((f) => ({ a: standA[f.rank]?.team ?? '', b: standB[f.rank]?.team ?? '' }))
}

export type NewMatch = Omit<VolleyMatch, 'id'>

export function buildSchedule(): NewMatch[] {
  const out: NewMatch[] = []
  let sort = 0
  for (const s of VOLLEY_SCHIENEN) {
    for (const g of ['A', 'B']) {
      for (const [a, b] of roundRobinPairs(s.gruppen[g])) {
        out.push({ schiene: s.schiene, gruppe: g, team_a: a, team_b: b, score_a: null, score_b: null, status: 'geplant', phase: 'gruppe', platz: null, sort: sort++ })
      }
    }
  }
  for (const s of VOLLEY_SCHIENEN) {
    for (const f of FINALS) {
      out.push({
        schiene: s.schiene,
        gruppe: '',
        team_a: `${f.rank + 1}. Gruppe A`,
        team_b: `${f.rank + 1}. Gruppe B`,
        score_a: null,
        score_b: null,
        status: 'geplant',
        phase: 'final',
        platz: f.platz,
        sort: sort++,
      })
    }
  }
  return out
}
