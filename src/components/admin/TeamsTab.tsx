import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Wand2 } from 'lucide-react'
import { createTeam, deleteTeam, updateTeam } from '@/lib/api'
import type { Team } from '@/lib/types'
import { Button, GlassCard, TextInput } from '@/components/ui'
import { spring } from '@/lib/motion'

const PRESET: Array<{ g: number; letters: string[]; color: string }> = [
  { g: 5, letters: ['s'], color: '#de383d' },
  { g: 6, letters: ['s'], color: '#d3a544' },
  { g: 7, letters: ['a', 'b', 'c', 'd', 's'], color: '#b9852a' },
  { g: 8, letters: ['a', 'b', 'c', 'd', 's'], color: '#1f9d57' },
  { g: 9, letters: ['a', 'b', 'c', 'd', 's'], color: '#0ea5a4' },
  { g: 10, letters: ['a', 'b', 'c', 'd', 's'], color: '#6366f1' },
]
const letterSort = (l: string) => (l === 's' ? 5 : l.charCodeAt(0) - 96)

export function TeamsTab({ teams, reload }: { teams: Team[]; reload: () => void }) {
  const [items, setItems] = useState(teams)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => setItems(teams), [teams])

  const patch = async (id: string, p: Partial<Team>) => {
    setItems((arr) => arr.map((t) => (t.id === id ? { ...t, ...p } : t)))
    try {
      await updateTeam(id, p)
    } catch {
      reload()
    }
  }

  const add = async () => {
    if (!newName.trim()) return
    setBusy(true)
    try {
      await createTeam({ name: newName.trim(), sort: 999 })
      setNewName('')
      reload()
    } finally {
      setBusy(false)
    }
  }

  const insertPreset = async () => {
    setBusy(true)
    try {
      for (const grp of PRESET) {
        for (const l of grp.letters) {
          await createTeam({ name: `${grp.g}${l}`, jahrgang: grp.g, farbe: grp.color, sort: grp.g * 10 + letterSort(l) })
        }
      }
      reload()
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Klasse wirklich löschen? Ihre Punkte gehen verloren.')) return
    setItems((arr) => arr.filter((t) => t.id !== id))
    try {
      await deleteTeam(id)
    } finally {
      reload()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <TextInput label="Neue Klasse" placeholder="z.B. 7a" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        </div>
        <Button onClick={add} disabled={busy || !newName.trim()}>
          <Plus className="h-4 w-4" /> Hinzufügen
        </Button>
        {items.length === 0 && (
          <Button variant="glass" onClick={insertPreset} disabled={busy}>
            <Wand2 className="h-4 w-4" /> Standard-Klassen (5s–10s)
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((t) => (
          <motion.div key={t.id} layout transition={spring}>
            <GlassCard className="flex items-center gap-2 p-2.5">
              <input
                type="color"
                value={t.farbe}
                onChange={(e) => patch(t.id, { farbe: e.target.value })}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent"
                title="Farbe"
              />
              <input
                value={t.name}
                onChange={(e) => setItems((arr) => arr.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))}
                onBlur={(e) => patch(t.id, { name: e.target.value })}
                className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 font-bold outline-none focus:bg-white/70"
              />
              <input
                type="number"
                value={t.jahrgang ?? ''}
                onChange={(e) => patch(t.id, { jahrgang: e.target.value ? Number(e.target.value) : null })}
                className="w-16 rounded-lg bg-graphite/[0.05] px-2 py-1 text-center text-base font-semibold outline-none focus:bg-white"
                title="Jahrgang"
              />
              <button onClick={() => remove(t.id)} className="grid h-11 w-11 place-items-center rounded-lg text-graphite-soft/50 hover:bg-crimson-500/10 hover:text-crimson-600" title="Löschen">
                <Trash2 className="h-4 w-4" />
              </button>
            </GlassCard>
          </motion.div>
        ))}
      </div>
      {items.length > 0 && (
        <p className="text-xs text-graphite-soft">{items.length} Klassen · Änderungen werden automatisch gespeichert.</p>
      )}
    </div>
  )
}
