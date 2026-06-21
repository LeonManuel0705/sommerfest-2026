import { useEffect, useState } from 'react'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { fetchAudit } from '@/lib/api'
import type { AuditEntry, StationAdmin, Team } from '@/lib/types'
import { Button, EmblemLoader, GlassCard } from '@/components/ui'
import { fmt } from '@/lib/format'

export function AuditTab({ teams, stations }: { teams: Team[]; stations: StationAdmin[] }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? '—'
  const stationName = (id: string | null) => stations.find((s) => s.id === id)?.name ?? '—'

  const load = () => {
    setEntries(null)
    fetchAudit().then(setEntries).catch(() => setEntries([]))
  }
  useEffect(load, [])

  if (entries === null)
    return (
      <div className="grid place-items-center py-16">
        <EmblemLoader />
      </div>
    )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-graphite-soft">Jede Punkt-Änderung – wer, wann, was.</p>
        <Button size="sm" variant="glass" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Aktualisieren
        </Button>
      </div>
      {entries.length === 0 ? (
        <GlassCard className="p-8 text-center text-graphite-soft">Noch keine Einträge.</GlassCard>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e) => (
            <GlassCard key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-28 shrink-0 text-xs text-graphite-soft/70">
                {new Date(e.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex flex-1 flex-wrap items-center gap-1">
                <b>{teamName(e.team_id)}</b>
                <span className="text-graphite-soft">·</span>
                <span className="text-graphite-soft">{stationName(e.station_id)}</span>
                <span className="ml-1 inline-flex items-center gap-1.5 text-graphite-soft">
                  <span className="tabular">{e.alt !== null ? fmt(e.alt) : '–'}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <b className="tabular text-moss-700">{fmt(e.neu ?? 0)}</b>
                </span>
              </span>
              <span className="max-w-[40%] truncate text-xs font-semibold text-graphite-soft/70" title={e.akteur ?? ''}>
                {e.akteur ?? 'unbekannt'}
              </span>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
