import { describe, expect, it } from 'vitest'
import { activeKeyboard, keyboards } from './keyboard'

// THE RULE as a check: every fact names a known source, and the manual's 43 controls are all there.
describe('keyboard profiles', () => {
  it('active keyboard defaults to the JK-825', () => {
    expect(activeKeyboard().model).toBe('JK-825')
  })

  for (const kb of Object.values(keyboards)) {
    it(`${kb.id}: facts are source-tagged`, () => {
      const ids = new Set(kb.sources.map((s) => s.id))
      const facts = [
        ...kb.controls,
        ...kb.teachingModes,
        ...kb.howTos.flatMap((h) => h.notes),
        ...kb.troubleshooting.flatMap((t) => t.steps).filter((s) => !s.comingSoon),
      ]
      for (const f of facts) {
        expect(typeof f.verified).toBe('boolean')
        expect(ids.has(f.source!)).toBe(true)
      }
      for (const h of kb.howTos) expect(h.steps.length > 0 || h.comingSoon).toBe(true)
      expect(ids.has(kb.tonesSource) && ids.has(kb.rhythmsSource)).toBe(true)
    })
  }

  it('jikada-61 has controls 1–43 exactly once', () => {
    const nums = keyboards['jikada-61'].controls.map((c) => c.num).sort((a, b) => a - b)
    expect(nums).toEqual(Array.from({ length: 43 }, (_, i) => i + 1))
  })
})
