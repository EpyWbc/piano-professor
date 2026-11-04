import { getProgress } from './store'

// Shapes of data/keyboards/*.json. THE RULE: every fact carries `verified` + `source` (ids from research/keyboard.md).
export type SourceId = 'S1' | 'S2' | 'S3' | 'S4'
export type Source = { id: SourceId; name: string; primary: boolean }
export type Fact = { text: string; verified: boolean; source?: SourceId; comingSoon?: boolean }

export type ControlGroup =
  | 'power' | 'mp3' | 'chords' | 'sound' | 'display' | 'effects' | 'volume-tempo' | 'lesson' | 'numbers' | 'keys' | 'ports'

export type Control = {
  id: string
  num: number      // number in the manual's panel diagram (S1)
  label: string    // text as printed on the panel
  group: ControlGroup
  does: string     // "" = not known yet
  verified: boolean
  source: SourceId
  panel: { row: number; col: number } // rough position within its group's cluster
}

export type Numbered = { num: number; name: string }

export type KeyboardProfile = {
  id: string
  brand: string
  listingName: string
  model: string
  sources: Source[]
  features: { touchSensitive: boolean | null; usbMidi: boolean | null; lightedKeys: true }
  counts: { keys: number; tones: number; rhythms: number; demos: number; source: SourceId }
  controls: Control[]
  tones: Numbered[] // verified entries only
  tonesSource: SourceId
  rhythms: Numbered[]
  rhythmsSource: SourceId
  demos: Numbered[]
  teachingModes: { id: string; name: string; control: number; does: string; howToEnter: string[]; verified: boolean; source: SourceId }[]
  howTos: { id: string; title: string; controls: number[]; steps: string[]; comingSoon: boolean; notes: Fact[] }[]
  troubleshooting: { id: string; title: string; steps: Fact[] }[]
}

// Adding a keyboard = adding a JSON file.
const files = import.meta.glob<KeyboardProfile>('/data/keyboards/*.json', { eager: true, import: 'default' })
export const keyboards: Record<string, KeyboardProfile> = Object.fromEntries(Object.values(files).map((p) => [p.id, p]))

export const activeKeyboard = (): KeyboardProfile =>
  keyboards[getProgress().settings.keyboardId] ?? keyboards['jikada-61']
