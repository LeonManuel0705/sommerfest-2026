import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="border-t border-graphite/[0.06] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-9 text-sm text-graphite-soft sm:flex-row sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5">
          <img src="/ehg-logo.png" alt="" className="h-7 w-7 rounded-lg bg-white object-contain p-0.5 ring-1 ring-black/5" />
          <span>Sommerfest 2026 · Ernst-Haeckel-Gymnasium Werder (Havel)</span>
        </div>
        <div className="flex gap-6">
          <Link to="/feedback" className="transition hover:text-graphite">Feedback</Link>
          <Link to="/impressum" className="transition hover:text-graphite">Impressum</Link>
          <Link to="/datenschutz" className="transition hover:text-graphite">Datenschutz</Link>
        </div>
      </div>
    </footer>
  )
}
