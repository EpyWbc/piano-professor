import { describe, expect, it } from 'vitest'
import { isUnlocked, levelProgress, levels, nextItem } from './levels'
import { allSongs } from './songs'
import { keyboards } from './keyboard'
import { emptyProgress } from './store'

const tickLevel = (n: number, checked: Record<string, true> = {}) => {
  for (const i of levels[n - 1].items) checked[i.id] = true
  return checked
}

describe('levels', () => {
  it('level 1 is always open; later levels open when the previous one is done', () => {
    const p = emptyProgress()
    expect(isUnlocked(1, p)).toBe(true)
    expect(isUnlocked(2, p)).toBe(false)
    const one = { ...p, checked: tickLevel(1) }
    expect(isUnlocked(2, one)).toBe(true)
    expect(isUnlocked(3, one)).toBe(false)
  })

  it('a level with one item missing stays locked', () => {
    const checked = tickLevel(1)
    delete checked[levels[0].items.at(-1)!.id]
    expect(isUnlocked(2, { ...emptyProgress(), checked })).toBe(false)
  })

  it('"I can play this" counts a song item as done', () => {
    const checked = tickLevel(1)
    const songItems = levels[0].items.filter((i) => i.songId)
    for (const i of songItems) delete checked[i.id]
    const canPlay = Object.fromEntries(songItems.map((i) => [i.songId!, '2026-01-01']))
    const p = { ...emptyProgress(), checked, canPlay }
    expect(levelProgress(levels[0], p)).toEqual({ done: levels[0].items.length, total: levels[0].items.length })
    expect(isUnlocked(2, p)).toBe(true)
  })

  it('nextItem walks forward and ends with null', () => {
    const p = emptyProgress()
    expect(nextItem(p)?.item.id).toBe(levels[0].items[0].id)
    const checked: Record<string, true> = { [levels[0].items[0].id]: true }
    expect(nextItem({ ...p, checked })?.item.id).toBe(levels[0].items[1].id)
    expect(nextItem({ ...p, checked: tickLevel(1) })?.level.n).toBe(2)
    const all = {}
    for (const l of levels) tickLevel(l.n, all)
    expect(nextItem({ ...p, checked: all })).toBeNull()
  })

  it('ticks in a locked level do not make it "next"', () => {
    expect(nextItem({ ...emptyProgress(), checked: tickLevel(3) })?.level.n).toBe(1)
  })
})

describe('levels.json integrity', () => {
  const items = levels.flatMap((l) => l.items)
  const controlIds = new Set(keyboards['jikada-61'].controls.map((c) => c.id))

  it('has levels 1–5 with 4–7 items each', () => {
    expect(levels.map((l) => l.n)).toEqual([1, 2, 3, 4, 5])
    for (const l of levels) expect(l.items.length >= 4 && l.items.length <= 7).toBe(true)
  })

  it('item ids are unique', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
  })

  it('every songId exists', () => {
    const songIds = new Set(allSongs.map((s) => s.id))
    for (const i of items) {
      expect(i.kind === 'song').toBe(!!i.songId)
      if (i.songId) expect(songIds.has(i.songId), i.songId).toBe(true)
    }
  })

  it('every keyboard control link points to a real control', () => {
    for (const i of items) {
      for (const [, id] of (i.keyboardTip ?? '').matchAll(/#\/keyboard\/control\/([\w-]+)/g)) {
        expect(controlIds.has(id), `${i.id}: ${id}`).toBe(true)
      }
    }
  })
})
