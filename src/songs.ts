import external from '../data/songs-external.json'

// Public-domain songs with notation. Two-hand songs use voices V:RH (voice 0) and V:LH (voice 1).
export type Song = {
  id: string
  title: string
  composer: string
  level: number
  genres: string[]
  publicDomain: true
  bpm: number // abcjs beats per minute (dotted quarter in 3/8)
  hands: 'right' | 'left' | 'both'
  abc: string
  tip?: string
}

// Modern songs: title + shop link only, never notation.
export type ExternalSong = { id: string; title: string; artist: string; level: number; link: string }

// Adding a song = adding a file to data/songs/.
const files = import.meta.glob<Song>('/data/songs/*.json', { eager: true, import: 'default' })

export const allSongs: Song[] = Object.values(files).sort((a, b) => a.level - b.level || a.title.localeCompare(b.title))
export const songById = (id: string) => allSongs.find((s) => s.id === id)
export const externalSongs: ExternalSong[] = external
