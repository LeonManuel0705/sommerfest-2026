import { motion } from 'framer-motion'
import { Building2, MapPin, Trees } from 'lucide-react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { StationIcon } from '@/components/icons'

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

function Karte({ o, i }: { o: Ort; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 110, damping: 18, delay: (i % 3) * 0.04 }}
      className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-moss-600/10 text-moss-700">
          <StationIcon name={o.icon} className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <span className="label-mono text-[10px] text-graphite-soft">Station {o.nr}</span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-graphite">{o.name}</h3>
      <div className="mt-1 flex items-start gap-1.5 text-sm text-graphite-soft">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" /> {o.ort}
      </div>
    </motion.div>
  )
}

function Gruppe({ titel, Icon, orte, start }: { titel: string; Icon: typeof Building2; orte: Ort[]; start: number }) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-graphite/[0.05] text-graphite">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-2xl text-graphite">{titel}</h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orte.map((o, i) => (
          <Karte key={o.name} o={o} i={start + i} />
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
        </div>

        <Gruppe titel="Im Gebäude" Icon={Building2} orte={DRINNEN} start={0} />
        <Gruppe titel="Auf dem Schulgelände" Icon={Trees} orte={DRAUSSEN} start={DRINNEN.length} />

        <p className="mt-10 text-xs text-graphite-soft">EG = Erdgeschoss · 1. OG = erstes Obergeschoss. Bei Unsicherheit fragt die Orga oder eine Lehrkraft.</p>
      </main>
      <SiteFooter />
    </div>
  )
}
