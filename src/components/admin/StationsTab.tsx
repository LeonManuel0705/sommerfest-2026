import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Asterisk, ChevronDown, ChevronUp, Copy, KeyRound, Pause, Play, Plus, Printer, RefreshCw, Trash2 } from 'lucide-react'
import { createStation, deleteStation, setStationPin, updateStation } from '@/lib/api'
import type { StationAdmin } from '@/lib/types'
import { Badge, Button, GlassCard, TextInput } from '@/components/ui'
import { StationIcon, STATION_ICON_NAMES } from '@/components/icons'
import { StationQRSheet } from '@/components/StationQRSheet'
import { spring } from '@/lib/motion'

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function StationsTab({ stations, reload }: { stations: StationAdmin[]; reload: () => void }) {
  const [items, setItems] = useState(stations)
  const [open, setOpen] = useState<string | null>(null)
  const [iconPicker, setIconPicker] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [printing, setPrinting] = useState(false)

  useEffect(() => setItems(stations), [stations])

  useEffect(() => {
    if (!printing) return
    const t = window.setTimeout(() => window.print(), 80)
    const reset = () => setPrinting(false)
    window.addEventListener('afterprint', reset)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('afterprint', reset)
    }
  }, [printing])

  const patch = async (id: string, p: Partial<StationAdmin>) => {
    setItems((arr) => arr.map((s) => (s.id === id ? { ...s, ...p } : s)))
    try {
      await updateStation(id, p)
    } catch {
      reload()
    }
  }

  const add = async () => {
    if (!newName.trim()) return
    await createStation({ name: newName.trim(), icon: 'medal', sort: items.length + 1 })
    setNewName('')
    reload()
  }

  const changePin = async (s: StationAdmin) => {
    const pin = prompt(`PIN für „${s.name}" setzen (Helfer brauchen sie zum Eintragen):`, s.pin ?? '')
    if (pin === null) return
    const val = pin.trim() || null
    await setStationPin(s.id, val)
    setItems((arr) => arr.map((x) => (x.id === s.id ? { ...x, pin_hash: val ? 'set' : null, pin: val } : x)))
  }

  const regen = async (s: StationAdmin) => {
    if (!confirm('Neuen Link/QR erzeugen? Der alte QR-Code funktioniert danach nicht mehr.')) return
    await patch(s.id, { token: randomToken() })
  }

  const remove = async (s: StationAdmin) => {
    if (!confirm(`Station „${s.name}" löschen?`)) return
    setItems((arr) => arr.filter((x) => x.id !== s.id))
    await deleteStation(s.id)
    reload()
  }

  const linkFor = (token: string) => `${window.location.origin}/s/${token}`

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextInput label="Neue Station / Spiel" placeholder="z.B. Sackhüpfen" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        </div>
        <Button onClick={add} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" /> Hinzufügen
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-graphite-soft">{items.length} Stationen · QR + PIN je Station unten ausklappen</p>
        <Button size="sm" variant="glass" onClick={() => setPrinting(true)}>
          <Printer className="h-4 w-4" /> Alle QR-Codes drucken
        </Button>
      </div>

      <div className="space-y-2.5">
        {items.map((s) => {
          const hasPin = Boolean(s.pin_hash)
          const isOpen = open === s.id
          return (
            <motion.div key={s.id} layout transition={spring}>
              <GlassCard className="overflow-visible">
                <div className="flex items-center gap-3 p-3">
                  <div className="relative">
                    <button
                      onClick={() => setIconPicker(iconPicker === s.id ? null : s.id)}
                      className="grid h-11 w-11 place-items-center rounded-xl bg-moss-500/10 text-moss-600 hairline transition hover:bg-moss-500/20"
                      title="Icon wählen"
                    >
                      <StationIcon name={s.icon} className="h-5 w-5" strokeWidth={1.9} />
                    </button>
                    <AnimatePresence>
                      {iconPicker === s.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="glass-solid absolute left-0 top-full z-20 mt-1 grid w-auto max-w-[min(15rem,calc(100vw-2rem))] grid-cols-5 gap-1 rounded-2xl p-2"
                        >
                          {STATION_ICON_NAMES.map((name) => (
                            <button
                              key={name}
                              onClick={() => {
                                patch(s.id, { icon: name })
                                setIconPicker(null)
                              }}
                              className="grid h-10 w-10 place-items-center rounded-lg text-graphite-soft transition hover:bg-moss-500/15 hover:text-moss-600"
                            >
                              <StationIcon name={name} className="h-4 w-4" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <input
                    value={s.name}
                    onChange={(e) => setItems((a) => a.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))}
                    onBlur={(e) => patch(s.id, { name: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 font-display text-lg font-bold outline-none focus:bg-white/70"
                  />
                  {!hasPin && <Badge className="bg-crimson-500/12 text-crimson-600">keine PIN</Badge>}
                  {!s.aktiv && <Badge className="bg-graphite/10 text-graphite-soft">inaktiv</Badge>}
                  {!s.pflicht && <Badge className="bg-brass-400/15 text-brass-500">optional</Badge>}
                  {s.gewicht !== 1 && <Badge className="bg-moss-500/12 text-moss-700">×{s.gewicht}</Badge>}
                  <button onClick={() => setOpen(isOpen ? null : s.id)} className="grid h-11 w-11 place-items-center rounded-lg text-graphite-soft hover:bg-graphite/[0.06]">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-graphite/8">
                      <div className="grid gap-4 p-4 sm:grid-cols-2">
                        <div className="space-y-3">
                          <TextInput
                            label="Beschreibung"
                            value={s.beschreibung ?? ''}
                            onChange={(e) => setItems((a) => a.map((x) => (x.id === s.id ? { ...x, beschreibung: e.target.value } : x)))}
                            onBlur={(e) => patch(s.id, { beschreibung: e.target.value })}
                          />
                          <div className="flex flex-wrap gap-3">
                            <TextInput
                              label="Einheit"
                              value={s.einheit ?? ''}
                              onChange={(e) => setItems((a) => a.map((x) => (x.id === s.id ? { ...x, einheit: e.target.value } : x)))}
                              onBlur={(e) => patch(s.id, { einheit: e.target.value })}
                            />
                            <label className="block w-28">
                              <span className="mb-1.5 block text-[13px] font-semibold tracking-wide text-graphite-soft">Gewicht</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={s.gewicht}
                                onChange={(e) => setItems((a) => a.map((x) => (x.id === s.id ? { ...x, gewicht: Number(e.target.value) } : x)))}
                                onBlur={(e) => patch(s.id, { gewicht: Number(e.target.value) || 1 })}
                                className="w-full rounded-xl border border-graphite/12 bg-white/70 px-3 py-3 text-center font-bold outline-none focus:bg-white"
                              />
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button size="sm" variant={hasPin ? 'glass' : 'primary'} onClick={() => changePin(s)}>
                              <KeyRound className="h-4 w-4" /> PIN {hasPin ? 'ändern' : 'setzen'}
                            </Button>
                            <Button size="sm" variant="glass" onClick={() => patch(s.id, { aktiv: !s.aktiv })}>
                              {s.aktiv ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              {s.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                            </Button>
                            <Button size="sm" variant="glass" onClick={() => patch(s.id, { pflicht: !s.pflicht })}>
                              <Asterisk className="h-4 w-4" /> {s.pflicht ? 'Als optional' : 'Als Pflicht'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => remove(s)} className="text-crimson-600">
                              <Trash2 className="h-4 w-4" /> Löschen
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 rounded-2xl bg-graphite/[0.03] p-4 hairline">
                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <QRCodeSVG value={linkFor(s.token)} size={132} fgColor="#11261e" />
                          </div>
                          <code className="max-w-full truncate rounded-lg bg-white/70 px-2 py-1 text-xs text-graphite-soft">/s/{s.token}</code>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-graphite-soft">PIN:</span>
                            {s.pin ? (
                              <button
                                onClick={() => navigator.clipboard?.writeText(s.pin!)}
                                title="PIN kopieren"
                                className="rounded-lg bg-moss-500/12 px-2.5 py-1 font-bold tracking-wider text-moss-700 tabular transition hover:bg-moss-500/20"
                              >
                                {s.pin}
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-graphite-soft/70">Leitung setzt selbst</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="glass" onClick={() => navigator.clipboard?.writeText(linkFor(s.token))}>
                              <Copy className="h-4 w-4" /> Link kopieren
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => regen(s)}>
                              <RefreshCw className="h-4 w-4" /> Neu
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {printing && <StationQRSheet stations={items} origin={window.location.origin} />}
    </div>
  )
}
