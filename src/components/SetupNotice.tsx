import { Database } from 'lucide-react'
import { GlassCard } from './ui'
import { RadiolariaMark } from './icons'

export function SetupNotice() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <GlassCard solid className="max-w-lg p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-moss-500/10 text-moss-600 hairline">
            <Database className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <RadiolariaMark className="h-9 w-9 text-graphite/20" />
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold">Fast geschafft – Supabase verbinden</h1>
        <p className="mb-5 text-[15px] leading-relaxed text-graphite-soft">
          Die App ist gebaut, braucht aber noch deine Supabase-Zugangsdaten. So geht's:
        </p>
        <ol className="space-y-2.5 text-sm text-graphite">
          <li>
            <b>1.</b> Auf{' '}
            <a className="font-semibold text-moss-700 underline" href="https://supabase.com" target="_blank" rel="noreferrer">
              supabase.com
            </a>{' '}
            ein kostenloses Projekt anlegen.
          </li>
          <li>
            <b>2.</b> Im <i>SQL-Editor</i> die Datei{' '}
            <code className="rounded bg-graphite/[0.06] px-1.5 py-0.5">supabase/setup.sql</code> einfügen und ausführen.
          </li>
          <li>
            <b>3.</b> Unter <i>Project Settings → API</i> die <b>Project URL</b> und den <b>anon public key</b> kopieren.
          </li>
          <li>
            <b>4.</b> Beides in die Datei <code className="rounded bg-graphite/[0.06] px-1.5 py-0.5">.env</code> eintragen und den Dev-Server neu starten.
          </li>
        </ol>
      </GlassCard>
    </div>
  )
}
