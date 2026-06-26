import {
  Bike,
  CupSoda,
  Dumbbell,
  Flag,
  Flame,
  Footprints,
  Goal,
  Medal,
  Mountain,
  Rabbit,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Utensils,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cx } from '@/lib/format'

function ringPoints(count: number, r: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2
    return { x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r, a }
  })
}

export function Radiolaria({
  className,
  spin = false,
  strokeWidth = 0.55,
}: {
  className?: string
  spin?: boolean
  strokeWidth?: number
}) {
  const corona = ringPoints(28, 1)
  const latticeOut = ringPoints(14, 33)
  const latticeIn = ringPoints(14, 21)
  const hex = ringPoints(6, 13)

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      <g className={spin ? 'origin-center [animation:spin_90s_linear_infinite]' : undefined} opacity="0.6">
        {corona.map((_p, i) => {
          const a = (i / corona.length) * Math.PI * 2 - Math.PI / 2
          const x1 = 50 + Math.cos(a) * 34
          const y1 = 50 + Math.sin(a) * 34
          const x2 = 50 + Math.cos(a) * (i % 2 ? 46 : 42)
          const y2 = 50 + Math.sin(a) * (i % 2 ? 46 : 42)
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              {i % 2 === 0 && <circle cx={x2} cy={y2} r="0.9" fill="currentColor" stroke="none" />}
            </g>
          )
        })}
      </g>

      <circle cx="50" cy="50" r="33" opacity="0.9" />

      <g opacity="0.75" strokeWidth={strokeWidth * 0.8}>
        {latticeOut.map((p, i) => {
          const nextOut = latticeOut[(i + 1) % latticeOut.length]
          const inn = latticeIn[i]
          const nextIn = latticeIn[(i + 1) % latticeIn.length]
          return (
            <g key={i}>
              <line x1={p.x} y1={p.y} x2={inn.x} y2={inn.y} />
              <line x1={p.x} y1={p.y} x2={nextOut.x} y2={nextOut.y} />
              <line x1={inn.x} y1={inn.y} x2={nextIn.x} y2={nextIn.y} />
              <line x1={p.x} y1={p.y} x2={nextIn.x} y2={nextIn.y} />
              <circle cx={p.x} cy={p.y} r="0.8" fill="currentColor" stroke="none" />
            </g>
          )
        })}
      </g>

      <circle cx="50" cy="50" r="21" opacity="0.55" strokeDasharray="1.4 2.2" />

      <g opacity="0.95">
        {hex.map((p, i) => {
          const next = hex[(i + 1) % hex.length]
          return (
            <g key={i}>
              <line x1={p.x} y1={p.y} x2={next.x} y2={next.y} />
              <line x1="50" y1="50" x2={p.x} y2={p.y} opacity="0.5" />
            </g>
          )
        })}
      </g>

      <circle cx="50" cy="50" r="6" opacity="0.9" />
      <circle cx="50" cy="50" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function RadiolariaMark({ className }: { className?: string }) {
  const spikes = ringPoints(12, 1)
  const hex = ringPoints(6, 17)
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3.2">
      {spikes.map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * 30}
            y1={50 + Math.sin(a) * 30}
            x2={50 + Math.cos(a) * 41}
            y2={50 + Math.sin(a) * 41}
            strokeLinecap="round"
            opacity="0.7"
          />
        )
      })}
      <circle cx="50" cy="50" r="30" />
      <g opacity="0.95">
        {hex.map((p, i) => {
          const next = hex[(i + 1) % hex.length]
          return <line key={i} x1={p.x} y1={p.y} x2={next.x} y2={next.y} strokeLinejoin="round" />
        })}
      </g>
      <circle cx="50" cy="50" r="6.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

const METAL: Record<number, { face: string; edge: string; rim: string; text: string }> = {
  1: { face: 'linear-gradient(150deg,#f4e3ad 0%,#e6c878 38%,#bd8f30 100%)', edge: '#a9781f', rim: '#f6ecbf', text: '#5c4410' },
  2: { face: 'linear-gradient(150deg,#f1f3f6 0%,#cdd3da 40%,#9aa3ad 100%)', edge: '#8b94a0', rim: '#f7f9fb', text: '#3c424a' },
  3: { face: 'linear-gradient(150deg,#f0c99e 0%,#d59a63 42%,#a8662f 100%)', edge: '#90531f', rim: '#f3d6b4', text: '#552d0f' },
}

export function RankMedal({ rank, size = 48, onInk = false }: { rank: number; size?: number; onInk?: boolean }) {
  const metal = METAL[rank]
  if (metal) {
    return (
      <span
        className="relative grid shrink-0 place-items-center rounded-full font-display font-bold tabular"
        style={{
          width: size,
          height: size,
          background: metal.face,
          boxShadow: `inset 0 1.5px 1px ${metal.rim}, inset 0 -2px 3px rgba(0,0,0,0.25), 0 2px 8px -2px ${metal.edge}aa`,
          color: metal.text,
          fontSize: size * 0.42,
        }}
      >
        <span
          className="absolute inset-[3px] rounded-full"
          style={{ border: `1px solid ${metal.rim}88` }}
        />
        {rank}
      </span>
    )
  }
  return (
    <span
      className={cx(
        'grid shrink-0 place-items-center rounded-full font-display font-bold tabular',
        onInk ? 'bg-white/10 text-white/80' : 'bg-graphite/[0.06] text-graphite-soft',
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {rank}
    </span>
  )
}

const STATION_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  medal: Medal,
  target: Target,
  flag: Flag,
  timer: Timer,
  zap: Zap,
  dumbbell: Dumbbell,
  bike: Bike,
  footprints: Footprints,
  waves: Waves,
  mountain: Mountain,
  rabbit: Rabbit,
  flame: Flame,
  wind: Wind,
  goal: Goal,
  sparkles: Sparkles,
  utensils: Utensils,
  'cup-soda': CupSoda,
}

export const STATION_ICON_NAMES = Object.keys(STATION_MAP)

export function StationIcon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: string | null | undefined
  className?: string
  strokeWidth?: number
}) {
  const Cmp = (name && STATION_MAP[name]) || Medal
  return <Cmp className={className} strokeWidth={strokeWidth} />
}
