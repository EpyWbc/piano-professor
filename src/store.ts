import { useSyncExternalStore } from 'react'

// All progress lives in one localStorage key. Bump `version` + add a migration in M3 if the shape changes.
export type Progress = {
  version: 1
  checked: Record<string, true>     // level item ids she has ticked
  canPlay: Record<string, string>   // songId → local date she marked "I can play this"
  log: Record<string, number>       // local 'YYYY-MM-DD' → minutes practiced
  settings: { keyboardId: string; name?: string; bpm: number }
}

export const STORAGE_KEY = 'pp:v1'

export const emptyProgress = (): Progress => ({
  version: 1,
  checked: {},
  canPlay: {},
  log: {},
  settings: { keyboardId: 'jikada-61', bpm: 80 },
})

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const saved = JSON.parse(raw)
    return { ...emptyProgress(), ...saved, settings: { ...emptyProgress().settings, ...saved.settings } }
  } catch {
    return emptyProgress() // no localStorage (tests) or corrupt JSON
  }
}

let state = load()
const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => (listeners.add(cb), () => listeners.delete(cb))

export const getProgress = () => state

export function setProgress(next: Progress | ((p: Progress) => Progress)) {
  state = typeof next === 'function' ? next(state) : next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Progress not saved (storage full or blocked)', e) // in-memory state still works this session
  }
  listeners.forEach((l) => l())
}

/** React hook: re-renders when progress changes. */
export const useProgress = () => useSyncExternalStore(subscribe, getProgress)

/** Local calendar date as 'YYYY-MM-DD'. Not toISOString(): that's UTC and flips to "tomorrow" in the evening. */
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
