import { Link } from 'react-router-dom'
import { cx } from '@/lib/format'

export function Brand({ className, to = '/' }: { className?: string; to?: string; onInk?: boolean }) {
  return (
    <Link to={to} className={cx('group inline-flex items-center gap-2.5', className)}>
      <img
        src="/ehg-logo.png"
        alt="Ernst-Haeckel-Gymnasium Werder"
        className="h-11 w-11 rounded-2xl object-contain bg-white/70 p-1 ring-1 ring-black/5 shadow-sm"
      />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-bold tracking-tight text-graphite">Sommerfest</span>
        <span className="label-mono text-[9px] text-graphite-soft">EHG Werder</span>
      </span>
    </Link>
  )
}
