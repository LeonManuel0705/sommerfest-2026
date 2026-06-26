import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Sparkles, Timer, Trophy, Users } from 'lucide-react'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { fetchVolleyMatches } from '@/lib/api'
import { computeStandings, VOLLEY_SCHIENEN, type VolleyMatch } from '@/lib/volley'
import { cx } from '@/lib/format'

const REGELN = [
  { Icon: Users, title: 'Teamgröße', desc: 'Mind. 6, max. 8 Spieler:innen im Kader.' },
  { Icon: Timer, title: 'Spielzeit', desc: '13 Min. pro Spiel. Bei Gleichstand 2 Punkte Vorsprung.' },
  { Icon: AlertTriangle, title: 'Pünktlichkeit', desc: 'Nicht antretende Teams verlieren mit 0:15.' },
  { Icon: Sparkles, title: 'Mindestquote', desc: 'Immer mind. 2 Mädchen aktiv auf dem Feld.' },
]

export default function Volleyball() {
  const [matches, setMatches] = useState<VolleyMatch[] | null>(null)

  useEffect(() => {
    let alive = true
    const load = () => fetchVolleyMatches().then((m) => alive && setMatches(m)).catch(() => {})
    load()
    const id = window.setInterval(load, 6000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])

  const live = (matches ?? []).filter((m) => m.status === 'live')

  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="max-w-2xl">
          <p className="label-mono text-xs text-moss-600">Sportliches Highlight</p>
          <h1 className="mt-2 font-display text-5xl text-graphite sm:text-6xl">Volleyball-Turnier</h1>
          <p className="mt-4 text-lg text-graphite-soft">
            Die Jahrgänge 7–10 treten in der Turnhalle an — Gruppenphase mit Live-Tabellen, dann die Finalspiele.
          </p>
        </div>

        {live.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl bg-gradient-to-br from-moss-600 to-moss-700 p-5 text-white shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              Jetzt im Spiel
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {live.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-2 font-display text-xl">
                  {m.team_a} <span className="text-white/70">{m.score_a ?? 0} : {m.score_b ?? 0}</span> {m.team_b}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REGELN.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-moss-600/10 text-moss-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-bold text-graphite">{title}</h3>
              <p className="mt-1 text-sm text-graphite-soft">{desc}</p>
            </div>
          ))}
        </div>

        {matches === null ? (
          <p className="mt-12 text-graphite-soft">Lädt…</p>
        ) : matches.length === 0 ? (
          <div className="mt-12 rounded-3xl bg-white p-10 text-center text-graphite-soft shadow-card ring-1 ring-black/5">
            Der Spielplan wird von der Orga noch erstellt.
          </div>
        ) : (
          VOLLEY_SCHIENEN.map((s) => (
            <section key={s.schiene} className="mt-12">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-3xl text-graphite">{s.label}</h2>
                <span className="text-sm text-graphite-soft">{s.zeit}</span>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {Object.entries(s.gruppen).map(([g, teams]) => {
                  const gm = matches.filter((m) => m.schiene === s.schiene && m.gruppe === g)
                  return <GroupCard key={g} gruppe={g} teams={teams} matches={gm} />
                })}
              </div>
            </section>
          ))
        )}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex items-center gap-4 rounded-3xl bg-white p-6 shadow-card ring-1 ring-black/5"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brass-400/15 text-brass-500">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <div className="font-display text-2xl text-graphite">Highlight: Lehrkräfte vs. Jahrgang 11</div>
            <div className="mt-0.5 text-graphite-soft">12:50 – 13:20 Uhr · Turnhalle — kommt zum Anfeuern vorbei!</div>
          </div>
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  )
}

function GroupCard({ gruppe, teams, matches }: { gruppe: string; teams: string[]; matches: VolleyMatch[] }) {
  const table = computeStandings(teams, matches)
  return (
    <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-black/5">
      <h3 className="font-display text-2xl text-graphite">Gruppe {gruppe}</h3>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-graphite/10 text-left text-[11px] uppercase tracking-wider text-graphite-soft">
            <th className="py-1.5 font-semibold">#</th>
            <th className="py-1.5 font-semibold">Klasse</th>
            <th className="py-1.5 text-center font-semibold">Sp</th>
            <th className="py-1.5 text-center font-semibold">S</th>
            <th className="py-1.5 text-center font-semibold">Diff</th>
            <th className="py-1.5 text-right font-semibold">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {table.map((r, i) => (
            <tr key={r.team} className="border-b border-graphite/[0.06] last:border-0">
              <td className="py-2">
                <span className={cx('grid h-6 w-6 place-items-center rounded-full text-xs font-bold', i === 0 ? 'bg-moss-600 text-white' : 'bg-paper text-graphite-soft')}>{i + 1}</span>
              </td>
              <td className="py-2 font-bold text-graphite">{r.team}</td>
              <td className="py-2 text-center tabular text-graphite-soft">{r.spiele}</td>
              <td className="py-2 text-center tabular text-graphite-soft">{r.siege}</td>
              <td className="py-2 text-center tabular text-graphite-soft">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
              <td className="py-2 text-right font-bold tabular text-graphite">{r.punkte}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 space-y-1.5">
        {matches.map((m) => (
          <div key={m.id} className={cx('flex items-center gap-2 rounded-xl px-3 py-2 text-sm', m.status === 'live' ? 'bg-moss-600/10 ring-1 ring-moss-500/30' : 'bg-paper')}>
            <span className="flex-1 text-right font-semibold text-graphite">{m.team_a}</span>
            <span className="w-16 text-center font-bold tabular text-graphite">
              {m.status === 'geplant' ? <span className="text-graphite-soft/50">vs</span> : `${m.score_a ?? 0} : ${m.score_b ?? 0}`}
            </span>
            <span className="flex-1 font-semibold text-graphite">{m.team_b}</span>
            {m.status === 'live' && <span className="label-mono text-[9px] text-moss-700">live</span>}
            {m.status === 'fertig' && <span className="label-mono text-[9px] text-graphite-soft/50">fertig</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
