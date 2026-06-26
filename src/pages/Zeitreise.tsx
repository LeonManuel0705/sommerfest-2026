import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'

const EPOCHEN = [
  { klasse: '5s', epoche: 'Steinzeitmenschen', zeit: 'ca. 2,5 Mio. – 2000 v. Chr.' },
  { klasse: '6s', epoche: 'Mesopotamier / Sumerer', zeit: 'ca. 4500 – 539 v. Chr.' },
  { klasse: '7a', epoche: 'Ägypten', zeit: 'ca. 3100 – 30 v. Chr.' },
  { klasse: '7b', epoche: 'Chinesen (Antike Dynastien)', zeit: 'ab ca. 2070 v. Chr.' },
  { klasse: '7c', epoche: 'Die Alten Griechen', zeit: 'ca. 800 – 146 v. Chr.' },
  { klasse: '7d', epoche: 'Etrusker', zeit: 'ca. 900 – 100 v. Chr.' },
  { klasse: '7s', epoche: 'Kelten / Gallier', zeit: 'ca. 800 v. Chr. – 400 n. Chr.' },
  { klasse: '8a', epoche: 'Römer', zeit: 'ca. 753 v. Chr. – 476 n. Chr.' },
  { klasse: '8b', epoche: 'Mayas / Azteken', zeit: 'ca. 2000 v. Chr. – 1521 n. Chr.' },
  { klasse: '8c', epoche: 'Wikinger', zeit: 'ca. 793 – 1066 n. Chr.' },
  { klasse: '8s', epoche: 'Ritter (Mittelalter)', zeit: 'ca. 1000 – 1500 n. Chr.' },
  { klasse: '9a', epoche: 'Die Mongolen', zeit: 'ca. 1206 – 1368 n. Chr.' },
  { klasse: '9b', epoche: 'Die Samurai', zeit: 'ca. 1185 – 1868 n. Chr.' },
  { klasse: '9c', epoche: 'Piraten', zeit: 'Goldenes Zeitalter, ca. 1650 – 1730' },
  { klasse: '9d', epoche: 'Ureinwohner Amerikas', zeit: 'bis zur europäischen Kolonisation' },
  { klasse: '9s', epoche: 'Cowboys / Cowgirls', zeit: 'ca. 1860 – 1890 n. Chr.' },
  { klasse: '10a', epoche: 'Roaring Twenties', zeit: '1920er-Jahre' },
  { klasse: '10b', epoche: 'Hippies', zeit: '1960er / 70er-Jahre' },
  { klasse: '10c', epoche: 'Punker / Rocker', zeit: '1980er-Jahre' },
  { klasse: '10d', epoche: 'Steampunk', zeit: 'fiktiv – alternative Vergangenheit' },
  { klasse: '10s', epoche: 'Cyberpunk', zeit: 'fiktiv – Zukunft' },
]

export default function Zeitreise() {
  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-graphite/[0.05] px-4 py-2 text-sm font-semibold text-graphite ring-1 ring-black/[0.06]">
            <History className="h-4 w-4 text-moss-600" /> Motto 2026
          </span>
          <h1 className="mt-5 font-display text-5xl text-graphite sm:text-6xl">Zeitreise</h1>
          <p className="mt-4 text-lg text-graphite-soft">
            Jede Klasse reist als eigene Epoche durch die Geschichte — von der Steinzeit bis in die Zukunft.
          </p>
        </div>

        <div className="relative mt-14 pl-10">
          <div className="absolute bottom-2 left-5 top-2 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-brass-400/60 via-moss-500/60 to-electric-500/60" />
          {EPOCHEN.map((e, i) => (
            <motion.div
              key={e.klasse}
              initial={{ opacity: 0, x: 14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, delay: (i % 6) * 0.03 }}
              className="relative mb-3"
            >
              <span className="absolute top-5 -left-5 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full bg-white ring-2 ring-moss-500">
                <span className="h-1.5 w-1.5 rounded-full bg-moss-500" />
              </span>
              <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-moss-600/10 font-display text-lg font-bold text-moss-700">
                  {e.klasse}
                </span>
                <div className="min-w-0">
                  <div className="font-display text-xl text-graphite">{e.epoche}</div>
                  <div className="text-sm text-graphite-soft">{e.zeit}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
