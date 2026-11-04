import { describe, expect, it } from 'vitest'
import pairings from '../data/sound-pairings.json'
import { keyboards } from './keyboard'
import { songById } from './songs'

// THE RULE as a check: pairings only use verified tone/rhythm numbers and real songs.
describe('sound pairings', () => {
  const kb = keyboards['jikada-61']
  const has = (list: { num: number }[], n: number) => list.some((x) => x.num === n)

  it('ids are unique', () => {
    expect(new Set(pairings.map((p) => p.id)).size).toBe(pairings.length)
  })

  for (const p of pairings) {
    it(`${p.id}: tone, rhythm and song exist`, () => {
      expect(has(kb.tones, p.tone)).toBe(true)
      if (p.rhythm !== undefined) expect(has(kb.rhythms, p.rhythm)).toBe(true)
      if (p.songId !== null) expect(songById(p.songId)).toBeDefined()
    })
  }
})
