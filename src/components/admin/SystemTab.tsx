import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, Clock, Database, ExternalLink, Gauge, LineChart, Plug, RefreshCw, Trophy, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fetchDbHealth, type DbHealth } from '@/lib/api'
import { Button, EmblemLoader } from '@/components/ui'
import { cx, fmt } from '@/lib/format'

type Sample = { t: number; latency: number; connections: number }
const MAX_SAMPLES = 60

function ago(iso: string | null | undefined): string {
  if (!iso) return '—'
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `vor ${s}s`
  if (s < 3600) return `vor ${Math.round(s / 60)} min`
  return `vor ${Math.round(s / 3600)} h`
}

export function SystemTab() {
  const [health, setHealth] = useState<DbHealth | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number>(0)
  const [now, setNow] = useState<number>(() => Date.now())
  const [history, setHistory] = useState<Sample[]>([])
  const busy = useRef(false)

  const load = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const { health, latencyMs } = await fetchDbHealth()
      setHealth(health)
      setLatency(latencyMs)
      setError(null)
      const t = Date.now()
      setUpdatedAt(t)
      setHistory((h) => [...h, { t, latency: latencyMs, connections: health.connections ?? 0 }].slice(-MAX_SAMPLES))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      busy.current = false
    }
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(load, 5000)
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      window.clearInterval(id)
      window.clearInterval(tick)
    }
  }, [load])

  if (!health && !error) {
    return (
      <div className="grid place-items-center py-16">
        <EmblemLoader />
      </div>
    )
  }

  const lat = latency ?? 9999
  const status = error ? 'down' : lat < 350 ? 'gut' : lat < 900 ? 'okay' : 'langsam'
  const statusColor = status === 'gut' ? 'moss' : status === 'down' || status === 'langsam' ? 'crimson' : 'brass'
  const rollbackRate =
    health && (health.xact_commit ?? 0) + (health.xact_rollback ?? 0) > 0
      ? (100 * (health.xact_rollback ?? 0)) / ((health.xact_commit ?? 0) + (health.xact_rollback ?? 0))
      : 0

  const sinceUpdate = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : 0
  const lats = history.map((h) => h.latency)
  const avgLat = lats.length ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : 0
  const maxLat = lats.length ? Math.max(...lats) : 0
  const minLat = lats.length ? Math.min(...lats) : 0
  const spanMin = history.length > 1 ? Math.max(1, Math.round(((history[history.length - 1].t - history[0].t) / 1000 / 60) || 1)) : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cx(
              'grid h-10 w-10 place-items-center rounded-2xl',
              statusColor === 'moss' ? 'bg-moss-600/10 text-moss-700' : statusColor === 'brass' ? 'bg-brass-400/15 text-brass-500' : 'bg-crimson-500/10 text-crimson-500',
            )}
          >
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold text-graphite">
              {error ? 'Keine Verbindung zur Datenbank' : status === 'gut' ? 'Datenbank läuft normal' : status === 'okay' ? 'Datenbank antwortet etwas träge' : 'Datenbank reagiert langsam'}
            </div>
            <div className="text-xs text-graphite-soft">{updatedAt ? `Aktualisiert vor ${sinceUpdate}s · alle 5 s` : 'lädt…'}</div>
          </div>
        </div>
        <Button size="sm" variant="glass" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Jetzt
        </Button>
      </div>

      {error ? (
        <div className="rounded-3xl bg-white p-6 text-center text-crimson-500 shadow-card ring-1 ring-black/5">Fehler: {error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric Icon={Zap} label="Antwortzeit" value={`${latency} ms`} tone={lat < 350 ? 'good' : lat < 900 ? 'warn' : 'bad'} />
            <Metric Icon={Plug} label="Aktive Verbindungen" value={String(health?.connections ?? '—')} />
            <Metric Icon={Database} label="DB-Größe" value={`${fmt(health?.db_size_mb ?? 0)} MB`} />
            <Metric Icon={Gauge} label="Cache-Trefferquote" value={`${fmt(health?.cache_hit_ratio ?? 0)} %`} tone={(health?.cache_hit_ratio ?? 0) >= 95 ? 'good' : 'warn'} />
            <Metric Icon={Trophy} label="Wertungen gesamt" value={String(health?.scores ?? 0)} />
            <Metric Icon={Clock} label="Letzte Eintragung" value={ago(health?.last_score)} />
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-graphite-soft/70" />
                <h3 className="font-bold text-graphite">Verlauf · Antwortzeit</h3>
              </div>
              <span className="text-xs text-graphite-soft">{spanMin > 0 ? `letzte ${spanMin} Min.` : 'sammelt Daten…'}</span>
            </div>
            <Chart values={lats} color="#008037" unit="ms" />
            {lats.length > 1 && (
              <div className="mt-1.5 flex gap-4 text-xs text-graphite-soft">
                <span>Ø {avgLat} ms</span>
                <span>max {maxLat} ms</span>
                <span>min {minLat} ms</span>
              </div>
            )}

            <h3 className="mt-5 font-bold text-graphite">Verlauf · Aktive Verbindungen</h3>
            <Chart values={history.map((h) => h.connections)} color="#2563eb" unit="" height="h-16" />
          </div>

          <p className="text-xs text-graphite-soft">
            {health?.xact_commit ?? 0} Transaktionen · {fmt(rollbackRate)} % Rollbacks · {health?.teams ?? 0} Klassen · {health?.stations_active ?? 0} aktive Stationen
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-graphite/[0.08] bg-paper-2/60 p-4 text-sm">
        <b className="text-graphite">CPU- und RAM-Auslastung</b>
        <a
          href="https://supabase.com/dashboard/project/_/reports/database"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-moss-700 hover:underline"
        >
          Supabase → Reports → Database <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}

function Chart({ values, color, unit, height = 'h-28' }: { values: number[]; color: string; unit: string; height?: string }) {
  if (values.length < 2) {
    return <div className={cx('mt-3 grid place-items-center rounded-2xl bg-paper-2/50 text-xs text-graphite-soft', height)}>Sammelt Daten… (alle 5 s ein Punkt)</div>
  }
  const max = Math.max(...values, 1)
  const n = values.length
  const xy = (v: number, i: number) => `${(i / (n - 1)) * 100},${39 - (v / max) * 37}`
  const line = values.map(xy).join(' ')
  const area = `0,40 ${line} 100,40`
  return (
    <div className={cx('relative mt-3', height)}>
      <span className="absolute right-1 top-0 text-[10px] text-graphite-soft/70">
        {Math.round(max)} {unit}
      </span>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
        <polygon points={area} fill={color} opacity="0.1" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Metric({ Icon, label, value, tone }: { Icon: LucideIcon; label: string; value: string; tone?: 'good' | 'warn' | 'bad' }) {
  const dot = tone === 'good' ? 'bg-moss-500' : tone === 'warn' ? 'bg-brass-400' : tone === 'bad' ? 'bg-crimson-500' : ''
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-graphite-soft/70" />
        {dot && <span className={cx('h-2 w-2 rounded-full', dot)} />}
      </div>
      <div className="mt-3 font-display text-3xl text-graphite tabular">{value}</div>
      <div className="label-mono mt-0.5 text-[10px] text-graphite-soft">{label}</div>
    </div>
  )
}
