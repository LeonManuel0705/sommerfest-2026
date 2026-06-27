export type Team = {
  id: string
  name: string
  jahrgang: number | null
  farbe: string
  sort: number
}

export type StationPublic = {
  id: string
  name: string
  beschreibung: string | null
  icon: string
  gewicht: number
  einheit: string | null
  aktiv: boolean
  pflicht: boolean
  sort: number
}

export type StationAdmin = StationPublic & {
  token: string
  pin_hash: string | null
  pin: string | null
}

export type AppSettings = {
  scoreboard_frozen: boolean
}

export type Score = {
  id: string
  station_id: string
  team_id: string
  punkte: number
  notiz: string | null
  eingetragen_von: string | null
  updated_at: string
}

export type LeaderboardRow = {
  team_id: string
  name: string
  jahrgang: number | null
  farbe: string
  sort: number
  gesamt: number
  stationen_gewertet: number
}

export type AuditEntry = {
  id: string
  station_id: string | null
  team_id: string | null
  aktion: string
  alt: number | null
  neu: number | null
  akteur: string | null
  created_at: string
}

export type StationSession = {
  station: {
    id: string
    name: string
    icon: string
    beschreibung: string | null
    einheit: string | null
    gewicht: number
  }
  teams: Array<{
    id: string
    name: string
    jahrgang: number | null
    farbe: string
    punkte: number | null
    updated_at: string | null
  }>
}
