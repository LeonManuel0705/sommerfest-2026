import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  CloudRain,
  Copy,
  Database,
  MapPin,
  Megaphone,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  Users,
  Volleyball,
} from 'lucide-react'
import { fetchSettingsRaw, setVolleyballAktiv, updateEventSettings, updateStation } from '@/lib/api'
import { refreshSettings, useEventSettings } from '@/lib/useSettings'
import { defaultZeitplan } from '@/lib/zeitplan'
import type { HinweisLevel, StationAdmin, ZeitplanEintrag } from '@/lib/types'
import { Button, TextInput } from '@/components/ui'
import { StationIcon } from '@/components/icons'
import { cx } from '@/lib/format'
import eventplanSql from '../../../supabase/eventplan.sql?raw'

const LEVEL_META: Array<{ id: HinweisLevel; label: string; chip: string }> = [
  { id: 'info', label: 'Info (blau)', chip: 'bg-sky-500/10 text-sky-700 ring-sky-500/25' },
  { id: 'warn', label: 'Wichtig (gelb)', chip: 'bg-brass-400/15 text-brass-500 ring-brass-400/30' },
  { id: 'alert', label: 'Dringend (rot)', chip: 'bg-crimson-500/10 text-crimson-600 ring-crimson-500/25' },
]

export function PlanTab({ stations, reloadSilent }: { stations: StationAdmin[]; reloadSilent: () => void }) {
  const settings = useEventSettings()
  const [migrated, setMigrated] = useState<boolean | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const checkMigration = useCallback(() => {
    fetchSettingsRaw()
      .then((row) => setMigrated(row !== null && 'regen_modus' in row))
      .catch(() => setMigrated(false))
  }, [])

  useEffect(() => {
    checkMigration()
  }, [checkMigration])

  const run = async (key: string, fn: () => Promise<void>): Promise<boolean> => {
    setSaving(key)
    setErr(null)
    try {
      await fn()
      await refreshSettings()
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setErr(
        /column|schema cache|function|not_authenticated/i.test(msg)
          ? 'Die DB kennt die neuen Felder/Funktionen noch nicht — bitte zuerst supabase/eventplan.sql im Supabase SQL-Editor ausführen (und eingeloggt bleiben).'
          : `Konnte nicht speichern${msg ? `: ${msg}` : ''}`,
      )
      refreshSettings().catch(() => {})
      return false
    } finally {
      setSaving(null)
    }
  }

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(eventplanSql)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setErr('Kopieren fehlgeschlagen — Datei supabase/eventplan.sql manuell öffnen.')
    }
  }

  const locked = migrated === false

  return (
    <div className="space-y-5">
      {locked && (
        <div className="rounded-3xl bg-brass-400/[0.12] p-5 ring-1 ring-brass-400/30">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brass-400/20 text-brass-500">
              <Database className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl text-graphite">Einmaliges DB-Update nötig</h3>
              <p className="mt-1 text-sm leading-relaxed text-graphite-soft">
                Damit diese Schalter funktionieren, muss einmal das Skript <code className="rounded bg-graphite/[0.06] px-1.5 py-0.5 text-xs">supabase/eventplan.sql</code> im
                Supabase <strong>SQL-Editor</strong> laufen. Es ist ungefährlich: löscht nichts, setzt keine Punkte zurück und kann mehrfach ausgeführt werden.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={copySql}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Kopiert!' : 'SQL kopieren'}
                </Button>
                <Button size="sm" variant="glass" onClick={checkMigration}>
                  <RotateCcw className="h-4 w-4" /> Erneut prüfen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {err && <p className="rounded-2xl bg-crimson-500/12 px-4 py-2.5 text-sm font-semibold text-crimson-600">{err}</p>}

      <div className={cx('space-y-5', locked && 'pointer-events-none opacity-50')}>
        <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', settings.regen_modus ? 'bg-sky-500/12 text-sky-600' : 'bg-brass-400/15 text-brass-500')}>
                {settings.regen_modus ? <CloudRain className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </span>
              <div>
                <div className="font-display text-xl text-graphite">Wetterplan</div>
                <div className="text-sm text-graphite-soft">
                  {settings.regen_modus
                    ? 'Regenplan aktiv: Lageplan zeigt die Ausweich-Orte, Texte sind auf Regen umgestellt.'
                    : 'Normalplan aktiv: Lageplan zeigt die regulären Orte.'}
                </div>
              </div>
            </div>
            <div className="flex rounded-full bg-graphite/[0.05] p-1">
              {([
                { regen: false, label: 'Normal', Icon: Sun },
                { regen: true, label: 'Regen', Icon: CloudRain },
              ] as const).map(({ regen, label, Icon }) => {
                const active = settings.regen_modus === regen
                return (
                  <button
                    key={label}
                    disabled={saving === 'plan'}
                    onClick={() => !active && run('plan', () => updateEventSettings({ regen_modus: regen }))}
                    className={cx(
                      'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                      active ? (regen ? 'bg-sky-500 text-white shadow' : 'bg-brass-400 text-white shadow') : 'text-graphite-soft hover:text-graphite',
                    )}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <SwitchCard
          Icon={Volleyball}
          title="Volleyball-Turnier"
          on={settings.volleyball_aktiv}
          onText="Findet statt: Turnierseite mit Spielplan ist live, Turnierleitungs-Links funktionieren."
          offText="Fällt aus: Absage-Seite ist live, Station zählt nicht in der Wertung, Leiter-Links sind gesperrt."
          saving={saving === 'volley'}
          onToggle={(next) => run('volley', () => setVolleyballAktiv(next))}
          hint="Schaltet automatisch auch die Station „Volleyball-Turnier“ in der Wertung an/aus."
        />

        <SwitchCard
          Icon={Users}
          title="Lehrkräfte vs. Jahrgang 11"
          on={settings.lehrer_spiel_aktiv}
          onText="Findet statt: Wird auf Start- und Volleyball-Seite als Highlight angekündigt (12:50–13:20, Turnhalle)."
          offText="Fällt aus: Ankündigungen sind ausgeblendet — Ausnahme: ein manuell gespeicherter Zeitplan behält seine Texte."
          saving={saving === 'lehrer'}
          onToggle={(next) => run('lehrer', () => updateEventSettings({ lehrer_spiel_aktiv: next }))}
        />

        <HinweisCard
          text={settings.hinweis_text}
          level={settings.hinweis_level}
          saving={saving === 'hinweis'}
          onSave={(text, level) => run('hinweis', () => updateEventSettings({ hinweis_text: text, hinweis_level: level }))}
        />

        <ZeitplanCard
          zeitplan={settings.zeitplan}
          fallback={defaultZeitplan(settings)}
          saving={saving === 'zeitplan'}
          warnung={
            settings.zeitplan
              ? !settings.lehrer_spiel_aktiv && settings.zeitplan.some((z) => `${z.title} ${z.desc}`.includes('Lehrkräfte'))
                ? 'Achtung: Der gespeicherte Zeitplan erwähnt noch das Lehrkräfte-Spiel, obwohl es auf „fällt aus“ steht — Text anpassen oder „Standard wiederherstellen“.'
                : 'Ein gespeicherter Zeitplan folgt den Schaltern (Wetter, Lehrkräfte-Spiel) nicht mehr automatisch — bei Planänderungen Texte hier mitpflegen.'
              : null
          }
          onSave={(z) => run('zeitplan', () => updateEventSettings({ zeitplan: z }))}
        />

        <OrteCard stations={stations} reloadSilent={reloadSilent} onError={(m) => setErr(m)} />
      </div>

      <p className="text-xs text-graphite-soft">
        Alle Änderungen hier gehen direkt in die Datenbank und sind ohne Deploy nach wenigen Sekunden auf allen Geräten sichtbar (Realtime + 15-s-Abgleich).
      </p>
    </div>
  )
}

function SwitchCard({
  Icon,
  title,
  on,
  onText,
  offText,
  saving,
  onToggle,
  hint,
}: {
  Icon: typeof Volleyball
  title: string
  on: boolean
  onText: string
  offText: string
  saving: boolean
  onToggle: (next: boolean) => void
  hint?: string
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', on ? 'bg-moss-600/10 text-moss-700' : 'bg-crimson-500/10 text-crimson-500')}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2 font-display text-xl text-graphite">
              {title}
              <span
                className={cx(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                  on ? 'bg-moss-600/10 text-moss-700' : 'bg-crimson-500/10 text-crimson-500',
                )}
              >
                {on ? 'findet statt' : 'fällt aus'}
              </span>
            </div>
            <div className="max-w-xl text-sm text-graphite-soft">{on ? onText : offText}</div>
          </div>
        </div>
        <button
          onClick={() => onToggle(!on)}
          disabled={saving}
          aria-label={`${title} umschalten`}
          className={cx('relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50', on ? 'bg-moss-600' : 'bg-graphite/20')}
        >
          <span className={cx('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all', on ? 'left-7' : 'left-1')} />
        </button>
      </div>
      {hint && <p className="mt-3 rounded-2xl bg-graphite/[0.04] px-4 py-2 text-xs text-graphite-soft">{hint}</p>}
    </div>
  )
}

function HinweisCard({
  text,
  level,
  saving,
  onSave,
}: {
  text: string | null
  level: HinweisLevel
  saving: boolean
  onSave: (text: string | null, level: HinweisLevel) => void
}) {
  const [draft, setDraft] = useState(text ?? '')
  const [draftLevel, setDraftLevel] = useState<HinweisLevel>(level)
  const [seen, setSeen] = useState<{ text: string | null; level: HinweisLevel }>({ text, level })

  if (seen.text !== text || seen.level !== level) {
    setSeen({ text, level })
    setDraft(text ?? '')
    setDraftLevel(level)
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/12 text-sky-600">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <div className="font-display text-xl text-graphite">Live-Hinweis</div>
          <div className="text-sm text-graphite-soft">Erscheint sofort als Banner unter dem Menü auf allen öffentlichen Seiten — z.B. „Siegerehrung auf 14:30 verschoben“.</div>
        </div>
      </div>
      <div className="mt-4">
        <TextInput placeholder="z.B. Siegerehrung verschiebt sich auf 14:30 Uhr" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={180} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {LEVEL_META.map((l) => (
          <button
            key={l.id}
            onClick={() => setDraftLevel(l.id)}
            className={cx('rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition', l.chip, draftLevel === l.id ? 'ring-2' : 'opacity-60 hover:opacity-100')}
          >
            {l.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {text && (
            <Button size="sm" variant="glass" disabled={saving} onClick={() => onSave(null, draftLevel)}>
              <Trash2 className="h-4 w-4" /> Entfernen
            </Button>
          )}
          <Button size="sm" disabled={saving || draft.trim() === ''} onClick={() => onSave(draft.trim(), draftLevel)}>
            <Check className="h-4 w-4" /> Anzeigen
          </Button>
        </div>
      </div>
    </div>
  )
}

function ZeitplanCard({
  zeitplan,
  fallback,
  saving,
  warnung,
  onSave,
}: {
  zeitplan: ZeitplanEintrag[] | null
  fallback: ZeitplanEintrag[]
  saving: boolean
  warnung: string | null
  onSave: (z: ZeitplanEintrag[] | null) => Promise<boolean>
}) {
  const [items, setItems] = useState<ZeitplanEintrag[]>(zeitplan ?? fallback)
  const [dirty, setDirty] = useState(false)
  const [seen, setSeen] = useState(zeitplan)

  if (seen !== zeitplan) {
    setSeen(zeitplan)
    if (!dirty) setItems(zeitplan ?? fallback)
  }

  const edit = (i: number, patch: Partial<ZeitplanEintrag>) => {
    setDirty(true)
    setItems((arr) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  }
  const move = (i: number, d: -1 | 1) => {
    setDirty(true)
    setItems((arr) => {
      const j = i + d
      if (j < 0 || j >= arr.length) return arr
      const next = [...arr]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }
  const remove = (i: number) => {
    setDirty(true)
    setItems((arr) => arr.filter((_, j) => j !== i))
  }
  const add = () => {
    setDirty(true)
    setItems((arr) => [...arr, { time: '12:00', title: '', desc: '' }])
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-moss-600/10 text-moss-700">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <div className="font-display text-xl text-graphite">Zeitplan der Startseite</div>
            <div className="text-sm text-graphite-soft">{zeitplan ? 'Eigener Zeitplan aktiv.' : 'Aktuell läuft der Standard-Zeitplan.'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {zeitplan && (
            <Button
              size="sm"
              variant="glass"
              disabled={saving}
              onClick={async () => {
                if (await onSave(null)) setDirty(false)
              }}
            >
              <RotateCcw className="h-4 w-4" /> Standard wiederherstellen
            </Button>
          )}
          <Button
            size="sm"
            disabled={saving || !dirty}
            onClick={async () => {
              const clean = items.map((z) => ({ time: z.time.trim(), title: z.title.trim(), desc: z.desc.trim() })).filter((z) => z.title !== '')
              if (await onSave(clean.length > 0 ? clean : null)) setDirty(false)
            }}
          >
            <Check className="h-4 w-4" /> Speichern
          </Button>
        </div>
      </div>

      {warnung && <p className="mt-3 rounded-2xl bg-brass-400/[0.12] px-4 py-2.5 text-xs font-semibold text-brass-500 ring-1 ring-brass-400/25">{warnung}</p>}

      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((z, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center gap-2 rounded-2xl bg-graphite/[0.03] p-2 ring-1 ring-black/[0.04]"
            >
              <input
                value={z.time}
                onChange={(e) => edit(i, { time: e.target.value })}
                className="w-16 rounded-lg bg-white px-2 py-1.5 text-center text-sm font-bold tabular outline-none ring-1 ring-black/[0.06] focus:ring-moss-500/40"
                placeholder="08:00"
              />
              <input
                value={z.title}
                onChange={(e) => edit(i, { title: e.target.value })}
                className="min-w-32 flex-1 rounded-lg bg-white px-2 py-1.5 text-sm font-semibold outline-none ring-1 ring-black/[0.06] focus:ring-moss-500/40"
                placeholder="Titel"
              />
              <input
                value={z.desc}
                onChange={(e) => edit(i, { desc: e.target.value })}
                className="min-w-40 flex-[2] rounded-lg bg-white px-2 py-1.5 text-sm outline-none ring-1 ring-black/[0.06] focus:ring-moss-500/40"
                placeholder="Beschreibung"
              />
              <div className="flex shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="grid h-9 w-9 place-items-center rounded-lg text-graphite-soft/60 hover:bg-graphite/[0.05] disabled:opacity-30" title="Nach oben">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="grid h-9 w-9 place-items-center rounded-lg text-graphite-soft/60 hover:bg-graphite/[0.05] disabled:opacity-30" title="Nach unten">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button onClick={() => remove(i)} className="grid h-9 w-9 place-items-center rounded-lg text-graphite-soft/50 hover:bg-crimson-500/10 hover:text-crimson-600" title="Löschen">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <button onClick={add} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-moss-600/10 px-4 py-2.5 text-sm font-semibold text-moss-700 transition hover:bg-moss-600/15">
        <Plus className="h-4 w-4" /> Eintrag hinzufügen
      </button>
    </div>
  )
}

function OrteCard({ stations, reloadSilent, onError }: { stations: StationAdmin[]; reloadSilent: () => void; onError: (m: string) => void }) {
  const [items, setItems] = useState(stations)
  const focusVal = useRef('')

  const patch = async (id: string, p: Partial<StationAdmin>) => {
    try {
      await updateStation(id, p)
      reloadSilent()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      onError(
        /column|schema cache/i.test(msg)
          ? 'Die DB kennt die Orts-Felder noch nicht — bitte zuerst supabase/eventplan.sql ausführen.'
          : `Ort konnte nicht gespeichert werden${msg ? `: ${msg}` : ''}`,
      )
    }
  }

  const blurPatch = (id: string, field: 'nr' | 'ort_normal' | 'ort_regen', value: string) => {
    if (value === focusVal.current) return
    patch(id, { [field]: value.trim() || null })
  }

  const setLocal = (id: string, p: Partial<StationAdmin>) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...p } : x)))

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brass-400/15 text-brass-500">
          <MapPin className="h-5 w-5" />
        </span>
        <div>
          <div className="font-display text-xl text-graphite">Stations-Orte</div>
          <div className="text-sm text-graphite-soft">
            Normal-Ort und Regen-Ort pro Station — der Lageplan zeigt je nach Wetterplan automatisch den richtigen. Änderungen speichern beim Verlassen des Feldes.
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.filter((s) => s.name !== 'Versorgung').map((s) => (
          <div key={s.id} className="rounded-2xl bg-graphite/[0.03] p-3 ring-1 ring-black/[0.04]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-moss-500/10 text-moss-600">
                <StationIcon name={s.icon} className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <span className="min-w-32 flex-1 truncate font-bold text-graphite">{s.name}</span>
              <input
                value={s.nr ?? ''}
                onChange={(e) => setLocal(s.id, { nr: e.target.value })}
                onFocus={(e) => (focusVal.current = e.target.value)}
                onBlur={(e) => blurPatch(s.id, 'nr', e.target.value)}
                className="w-20 rounded-lg bg-white px-2 py-1.5 text-center text-sm font-semibold outline-none ring-1 ring-black/[0.06] focus:ring-moss-500/40"
                placeholder="Nr."
                title="Stationsnummern, z.B. 3 & 13"
              />
              <label className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-graphite-soft ring-1 ring-black/[0.06]">
                <input
                  type="checkbox"
                  checked={Boolean(s.draussen)}
                  onChange={(e) => {
                    setLocal(s.id, { draussen: e.target.checked })
                    patch(s.id, { draussen: e.target.checked })
                  }}
                  className="accent-moss-600"
                />
                draußen
              </label>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brass-500">
                  <Sun className="h-3 w-3" /> Normal-Ort
                </span>
                <input
                  value={s.ort_normal ?? ''}
                  onChange={(e) => setLocal(s.id, { ort_normal: e.target.value })}
                  onFocus={(e) => (focusVal.current = e.target.value)}
                  onBlur={(e) => blurPatch(s.id, 'ort_normal', e.target.value)}
                  className="w-full rounded-lg bg-white px-2.5 py-1.5 text-sm outline-none ring-1 ring-black/[0.06] focus:ring-moss-500/40"
                  placeholder="z.B. Fußballfeld"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sky-600">
                  <CloudRain className="h-3 w-3" /> Regen-Ort
                </span>
                <input
                  value={s.ort_regen ?? ''}
                  onChange={(e) => setLocal(s.id, { ort_regen: e.target.value })}
                  onFocus={(e) => (focusVal.current = e.target.value)}
                  onBlur={(e) => blurPatch(s.id, 'ort_regen', e.target.value)}
                  className="w-full rounded-lg bg-white px-2.5 py-1.5 text-sm outline-none ring-1 ring-black/[0.06] focus:ring-moss-500/40"
                  placeholder="leer = wie Normal-Ort"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
