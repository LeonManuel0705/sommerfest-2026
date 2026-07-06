import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'
import { fetchSettings } from './api'
import type { AppSettings } from './types'

export const DEFAULT_SETTINGS: AppSettings = {
  scoreboard_frozen: false,
  regen_modus: true,
  volleyball_aktiv: false,
  lehrer_spiel_aktiv: true,
  hinweis_text: null,
  hinweis_level: 'info',
  zeitplan: null,
}

type SettingsState = { settings: AppSettings; loaded: boolean }

let state: SettingsState = { settings: DEFAULT_SETTINGS, loaded: false }
const listeners = new Set<() => void>()
let started = false

function publish(next: SettingsState) {
  state = next
  listeners.forEach((fn) => fn())
}

function load() {
  return fetchSettings()
    .then((settings) => publish({ settings, loaded: true }))
    .catch(() => {})
}

export function refreshSettings(): Promise<void> {
  return load()
}

function start() {
  if (started) return
  started = true
  load()
  supabase
    .channel('public-settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, load)
    .subscribe()
  window.setInterval(load, 15000)
}

function subscribe(onChange: () => void) {
  start()
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

export function useEventSettingsState(): SettingsState {
  return useSyncExternalStore(subscribe, () => state)
}

export function useEventSettings(): AppSettings {
  return useEventSettingsState().settings
}

export function useScoreboardFrozen(): boolean {
  return useEventSettings().scoreboard_frozen
}
