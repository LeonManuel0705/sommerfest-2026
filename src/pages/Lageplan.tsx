import { motion } from 'framer-motion'
import { Building2, MapPin, Trees } from 'lucide-react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { StationIcon } from '@/components/icons'
import { cx } from '@/lib/format'

type Ort = { nr: string; name: string; icon: string; ort: string }

const DRINNEN: Ort[] = [
  { nr: '1 & 11', name: 'Allgemeinwissen-Quiz', icon: 'zap', ort: 'Raum 032 (EG) & 110 (1. OG)' },
  { nr: '2 & 12', name: 'Lehrkräfte-Quiz', icon: 'medal', ort: 'Raum 108 (1. OG) & 031 (EG)' },
  { nr: '4 & 14', name: 'Wasserpong', icon: 'waves', ort: 'Raum 135 & 136 (1. OG)' },
  { nr: '5 & 15', name: 'Just Dance', icon: 'flame', ort: 'Raum 137 & 138 (1. OG)' },
  { nr: '7 & 17', name: 'Stadt, Land, Fluss', icon: 'flag', ort: 'Raum 107 & 109 (1. OG)' },
  { nr: '8 & 18', name: 'Pantomime', icon: 'sparkles', ort: 'Raum 034 & 035 (EG)' },
  { nr: '21 & 22', name: 'Fotos', icon: 'target', ort: 'Aula' },
]

const DRAUSSEN: Ort[] = [
  { nr: '3 & 13', name: 'Hobbyhorsing', icon: 'wind', ort: 'Basketballplatz / unter der Eiche' },
  { nr: '6 & 16', name: 'Bobbycar-Racing', icon: 'bike', ort: '100-m-Bahn' },
  { nr: '9 & 19', name: 'Sackhüpfen', icon: 'rabbit', ort: 'Zwischen Turnhalle & 030er-Räumen' },
  { nr: '10 & 20', name: 'Laufen', icon: 'footprints', ort: 'Fußballfeld' },
  { nr: '—', name: 'Volleyball-Turnier', icon: 'goal', ort: 'Turnhalle' },
]

type Theme = { card: string; chip: string; pin: string; nr: string; head: string }
const DRIN: Theme = { card: 'bg-sky-50 ring-sky-600/10', chip: 'bg-sky-500/12 text-sky-600', pin: 'text-sky-500', nr: 'text-sky-700/55', head: 'bg-sky-500/12 text-sky-600' }
const DRAUS: Theme = { card: 'bg-emerald-50 ring-emerald-700/10', chip: 'bg-moss-600/12 text-moss-700', pin: 'text-moss-600', nr: 'text-moss-700/55', head: 'bg-moss-600/12 text-moss-700' }

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
      <div className="mt-1 flex items-start gap-1.5 text-sm text-graphite-soft">
        <MapPin className={cx('mt-0.5 h-4 w-4 shrink-0', t.pin)} /> {o.ort}
      </div>
    </motion.div>
  )
}

function Gruppe({ titel, Icon, orte, start, t }: { titel: string; Icon: typeof Building2; orte: Ort[]; start: number; t: Theme }) {
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
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sky-700 ring-1 ring-sky-600/10">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Im Gebäude
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-moss-700 ring-1 ring-emerald-700/10">
              <span className="h-2.5 w-2.5 rounded-full bg-moss-500" /> Auf dem Gelände
            </span>
          </div>
        </div>

        <Gruppe titel="Im Gebäude" Icon={Building2} orte={DRINNEN} start={0} t={DRIN} />
        <Gruppe titel="Auf dem Schulgelände" Icon={Trees} orte={DRAUSSEN} start={DRINNEN.length} t={DRAUS} />

        <p className="mt-10 text-xs text-graphite-soft">EG = Erdgeschoss · 1. OG = erstes Obergeschoss. Bei Unsicherheit fragt die Orga oder eine Lehrkraft.</p>
      </main>
      <SiteFooter />
    </div>
  )
}
