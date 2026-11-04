import data from '../data/levels.json'
import type { Progress } from './store'

// keyboardTip may contain links written as [label](#/keyboard/control/<id>).
export type LevelItem = {
  id: string
  kind: 'exercise' | 'song'
  title: string
  steps?: string[]
  songId?: string
  link?: string
  keyboardTip?: string
}
export type Level = { n: number; title: string; goal: string; intro: string; items: LevelItem[] }

export const levels = data as Level[]
export const levelByN = (n: number) => levels.find((l) => l.n === n)

type P = Pick<Progress, 'checked' | 'canPlay'>

/** Ticked, or (for songs) marked "I can play this" on the Songs screen. */
export const isDone = (item: LevelItem, p: P) => !!p.checked[item.id] || (!!item.songId && !!p.canPlay[item.songId])

export function levelProgress(level: Level, p: P) {
  return { done: level.items.filter((i) => isDone(i, p)).length, total: level.items.length }
}

const isComplete = (level: Level, p: P) => level.items.every((i) => isDone(i, p))

export function isUnlocked(levelN: number, p: P): boolean {
  if (levelN <= 1) return true
  const prev = levelByN(levelN - 1)
  return !!prev && isComplete(prev, p)
}

/** First unfinished item in the lowest unlocked, incomplete level; null when everything is done. */
export function nextItem(p: P): { level: Level; item: LevelItem } | null {
  for (const level of levels) {
    if (!isUnlocked(level.n, p)) continue
    const item = level.items.find((i) => !isDone(i, p))
    if (item) return { level, item }
  }
  return null
}
