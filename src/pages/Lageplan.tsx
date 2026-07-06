import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, CloudRain, MapPin, Trees } from 'lucide-react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { StationIcon } from '@/components/icons'
import { fetchStationsPublic } from '@/lib/api'
import { useEventSettingsState } from '@/lib/useSettings'
import { EmblemLoader } from '@/components/ui'
import type { StationPublic } from '@/lib/types'
import { cx } from '@/lib/format'

type OrtInfo = { nr: string; name: string; icon: string; ortNormal: string; ortRegen: string; draussen: boolean }
type Ort = { nr: string; name: string; icon: string; ort: string; vorher?: string }

const FALLBACK: OrtInfo[] = [
  { nr: '1 & 11', name: 'Allgemeinwissen-Quiz', icon: 'zap', ortNormal: 'Raum 032 (EG) & 110 (1. OG)', ortRegen: 'Raum 032 (EG) & 110 (1. OG)', draussen: false },
  { nr: '2 & 12', name: 'Lehrkräfte-Quiz', icon: 'medal', ortNormal: 'Raum 108 (1. OG) & 031 (EG)', ortRegen: 'Raum 108 (1. OG) & 031 (EG)', draussen: false },
  { nr: '3 & 13', name: 'Hobbyhorsing', icon: 'wind', ortNormal: 'Basketballplatz / unter der Eiche', ortRegen: 'Turnhalle', draussen: true },
  { nr: '4 & 14', name: 'Wasserpong', icon: 'waves', ortNormal: 'Raum 135 & 136 (1. OG)', ortRegen: 'Raum 135 & 136 (1. OG)', draussen: false },
  { nr: '5 & 15', name: 'Just Dance', icon: 'flame', ortNormal: 'Raum 137 & 138 (1. OG)', ortRegen: 'Raum 137 & 138 (1. OG)', draussen: false },
  { nr: '6 & 16', name: 'Bobbycar-Racing', icon: 'bike', ortNormal: '100-m-Bahn', ortRegen: 'Foyer', draussen: true },
  { nr: '7 & 17', name: 'Stadt, Land, Fluss', icon: 'flag', ortNormal: 'Raum 107 & 109 (1. OG)', ortRegen: 'Raum 107 & 109 (1. OG)', draussen: false },
  { nr: '8 & 18', name: 'Pantomime', icon: 'sparkles', ortNormal: 'Raum 034 & 035 (EG)', ortRegen: 'Raum 034 & 035 (EG)', draussen: false },
  { nr: '9 & 19', name: 'Sackhüpfen', icon: 'rabbit', ortNormal: 'Zwischen Turnhalle & 030er-Räumen', ortRegen: 'Aula', draussen: true },
  { nr: '10 & 20', name: 'Laufen', icon: 'footprints', ortNormal: 'Fußballfeld', ortRegen: 'Turnhalle', draussen: true },
  { nr: '21 & 22', name: 'Fotos', icon: 'target', ortNormal: 'Aula', ortRegen: 'Aula', draussen: false },
]

function toOrtInfo(stations: StationPublic[]): OrtInfo[] | null {
  const rows = stations
    .filter((s) => s.aktiv && s.name !== 'Versorgung' && s.name !== 'Volleyball-Turnier' && (s.ort_normal ?? '').trim() !== '')
    .map((s) => ({
      nr: (s.nr ?? '').trim() || '—',
      name: s.name,
      icon: s.icon,
      ortNormal: (s.ort_normal ?? '').trim(),
      ortRegen: ((s.ort_regen ?? '').trim() || (s.ort_normal ?? '').trim()),
      draussen: Boolean(s.draussen),
    }))
  return rows.length > 0 ? rows : null
}

type Theme = { card: string; chip: string; pin: string; nr: string; head: string }
const DRIN: Theme = { card: 'bg-sky-50 ring-sky-600/10', chip: 'bg-sky-500/12 text-sky-600', pin: 'text-sky-500', nr: 'text-sky-700/55', head: 'bg-sky-500/12 text-sky-600' }
const DRAUS: Theme = { card: 'bg-emerald-50 ring-emerald-700/10', chip: 'bg-moss-600/12 text-moss-700', pin: 'text-moss-600', nr: 'text-moss-700/55', head: 'bg-moss-600/12 text-moss-700' }
const REGEN: Theme = { card: 'bg-brass-400/[0.09] ring-brass-400/20', chip: 'bg-brass-400/20 text-brass-500', pin: 'text-brass-500', nr: 'text-brass-500/60', head: 'bg-brass-400/20 text-brass-500' }

function Karte({ o, i, t }: { o: Ort; i: number; t: Theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 110, damping: 18, delay: (i % 3) * 0.04 }}
      className={cx('rounded-3xl p-5 shadow-card ring-1', t.card)}
    >
      <div className="flex items-center justify-between">
        <span className={cx('grid h-11 w-11 place-items-center rounded-2xl', t.chip)}>
          <StationIcon name={o.icon} className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <span className={cx('label-mono text-[10px]', t.nr)}>Station {o.nr}</span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-graphite">{o.name}</h3>
      <div className={cx('mt-1 flex items-start gap-1.5 text-sm', o.vorher ? 'font-semibold text-graphite' : 'text-graphite-soft')}>
        <MapPin className={cx('mt-0.5 h-4 w-4 shrink-0', t.pin)} /> {o.ort}
      </div>
      {o.vorher && (
        <p className="mt-1.5 text-xs text-graphite-soft">
          vorher: <span className="line-through decoration-graphite-soft/50">{o.vorher}</span>
        </p>
      )}
    </motion.div>
  )
}

function Gruppe({ titel, Icon, orte, start, t }: { titel: string; Icon: typeof Building2; orte: Ort[]; start: number; t: Theme }) {
  if (orte.length === 0) return null
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2.5">
        <span className={cx('grid h-9 w-9 place-items-center rounded-xl', t.head)}>
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-2xl text-graphite">{titel}</h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orte.map((o, i) => (
          <Karte key={o.name} o={o} i={start + i} t={t} />
        ))}
      </div>
    </div>
  )
}

export default function Lageplan() {
  const { settings, loaded } = useEventSettingsState()
  const [stations, setStations] = useState<StationPublic[]>([])

  useEffect(() => {
    let alive = true
    const load = () =>
      fetchStationsPublic()
        .then((s) => alive && setStations(s))
        .catch(() => {})
    load()
    const id = window.setInterval(load, 30000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])

  const rows = toOrtInfo(stations) ?? FALLBACK
  const regen = settings.regen_modus

  const volleyRow = stations.find((s) => s.name === 'Volleyball-Turnier')
  const volleyOrtNormal = (volleyRow?.ort_normal ?? '').trim() || 'Turnhalle'
  const volleyOrt = regen ? (volleyRow?.ort_regen ?? '').trim() || volleyOrtNormal : volleyOrtNormal
  const volleyKarte: Ort = { nr: (volleyRow?.nr ?? '').trim() || '—', name: 'Volleyball-Turnier', icon: volleyRow?.icon ?? 'goal', ort: volleyOrt }

  const umgezogen: Ort[] = regen
    ? rows.filter((r) => r.ortRegen !== r.ortNormal).map((r) => ({ nr: r.nr, name: r.name, icon: r.icon, ort: r.ortRegen, vorher: r.ortNormal }))
    : []
  const unveraendert: Ort[] = regen
    ? rows.filter((r) => r.ortRegen === r.ortNormal).map((r) => ({ nr: r.nr, name: r.name, icon: r.icon, ort: r.ortNormal }))
    : []
  const drinnen: Ort[] = regen ? [] : rows.filter((r) => !r.draussen).map((r) => ({ nr: r.nr, name: r.name, icon: r.icon, ort: r.ortNormal }))
  const draussen: Ort[] = regen ? [] : rows.filter((r) => r.draussen).map((r) => ({ nr: r.nr, name: r.name, icon: r.icon, ort: r.ortNormal }))
  if (settings.volleyball_aktiv) {
    if (regen) unveraendert.push(volleyKarte)
    else (volleyRow?.draussen ? draussen : drinnen).push(volleyKarte)
  }

  if (!loaded) {
    return (
      <div className="min-h-dvh bg-paper">
        <SiteHeader />
        <main className="mx-auto grid max-w-5xl place-items-center px-5 py-32 sm:px-8">
          <EmblemLoader />
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="max-w-2xl">
          <p className="label-mono text-xs text-moss-600">Orientierung</p>
          <h1 className="mt-2 font-display text-5xl text-graphite sm:text-6xl">Wo finde ich was?</h1>
          <p className="mt-4 text-lg text-graphite-soft">
            Jede Disziplin gibt es zweimal, damit mehrere Klassen gleichzeitig antreten — die beiden Stationen liegen oft in verschiedenen Räumen oder sogar
            Etagen. Achte deshalb auf die Raumnummer und das Stockwerk.
          </p>
        </div>

        {regen && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 110, damping: 18, delay: 0.1 }}
            className="mt-8 flex items-start gap-4 rounded-3xl bg-sky-500/[0.08] p-6 ring-1 ring-sky-500/20"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-600">
              <CloudRain className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-graphite">Regenplan aktiv</h2>
              <p className="mt-1 text-sm leading-relaxed text-graphite-soft">
                Wegen des Wetters finden alle Stationen im Gebäude statt. Umgezogene Stationen sind unten gelb markiert
                {settings.volleyball_aktiv ? '.' : ' — das Volleyball-Turnier fällt aus.'}
              </p>
            </div>
          </motion.div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
          {regen ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-brass-400/[0.12] px-3 py-1.5 text-brass-500 ring-1 ring-brass-400/25">
                <span className="h-2.5 w-2.5 rounded-full bg-brass-400" /> Neuer Ort wegen Regen
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sky-700 ring-1 ring-sky-600/10">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Wie geplant
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sky-700 ring-1 ring-sky-600/10">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Im Gebäude
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-moss-700 ring-1 ring-emerald-700/10">
                <span className="h-2.5 w-2.5 rounded-full bg-moss-500" /> Auf dem Gelände
              </span>
            </>
          )}
        </div>

        {regen ? (
          <>
            <Gruppe titel="Wegen Regen umgezogen" Icon={CloudRain} orte={umgezogen} start={0} t={REGEN} />
            <Gruppe titel="Wie geplant im Gebäude" Icon={Building2} orte={unveraendert} start={umgezogen.length} t={DRIN} />
          </>
        ) : (
          <>
            <Gruppe titel="Im Gebäude" Icon={Building2} orte={drinnen} start={0} t={DRIN} />
            <Gruppe titel="Auf dem Schulgelände" Icon={Trees} orte={draussen} start={drinnen.length} t={DRAUS} />
          </>
        )}

        {!settings.volleyball_aktiv && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            className="mt-10 flex items-center gap-4 rounded-3xl bg-graphite/[0.04] p-5 ring-1 ring-black/5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-crimson-500/10 text-crimson-500">
              <StationIcon name="goal" className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-graphite">Volleyball-Turnier</h3>
                <span className="rounded-full bg-crimson-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-crimson-500">Fällt aus</span>
              </div>
              <p className="mt-0.5 text-sm text-graphite-soft">
                {regen
                  ? 'Die Turnhalle wird bei Regen für die Stationen gebraucht — das Turnier kann leider nicht stattfinden.'
                  : 'Das Turnier musste leider abgesagt werden — Infos gibt es auf der Volleyball-Seite.'}
              </p>
            </div>
          </motion.div>
        )}

        <p className="mt-10 text-xs text-graphite-soft">EG = Erdgeschoss · 1. OG = erstes Obergeschoss. Bei Unsicherheit fragt die Orga oder eine Lehrkraft.</p>
      </main>
      <SiteFooter />
    </div>
  )
}
