export type VolleyMatch = {
  id: string
  schiene: number
  gruppe: string
  team_a: string
  team_b: string
  score_a: number | null
  score_b: number | null
  status: 'geplant' | 'live' | 'fertig'
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

export function buildSchedule(): Omit<VolleyMatch, 'id' | 'status' | 'score_a' | 'score_b'>[] {
  const out: Omit<VolleyMatch, 'id' | 'status' | 'score_a' | 'score_b'>[] = []
  let sort = 0
  for (const s of VOLLEY_SCHIENEN) {
    for (const g of ['A', 'B']) {
      for (const [a, b] of roundRobinPairs(s.gruppen[g])) {
        out.push({ schiene: s.schiene, gruppe: g, team_a: a, team_b: b, sort: sort++ })
      }
    }
  }
  return out
}
