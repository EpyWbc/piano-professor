# Piano Professor — PLAN

## Context
A personal piano-learning PWA for a beginner (her copy first, product-ready later). Primary device: iPad in landscape on the keyboard's music stand, launched from a home-screen icon. Also iPhone (progress/guides) and Mac Chrome (MIDI, if possible). No backend; content in data files; keyboard specifics in a swappable profile.

Full research: `research/keyboard.md`. Licenses: `research/licenses.md`.

---

## Research findings (go into `research/keyboard.md` in M0)

| Item | Status | Finding / Source |
|---|---|---|
| Amazon listing | VERIFIED | ASIN **B08T61FPTV**; title matches exactly (amazon.com/dp/B08T61FPTV) |
| Model | **VERIFIED: JK-825** | Her panel photo reads "JK-825 · 255 TIMBRES · 255 RHYTHMS · 50 SONGS · KEY LIGHTING 3-STEP LESSON". "JIKADA-61" is only Amazon's listing name |
| Controls 1–43 | **VERIFIED** (her manual p.1 + panel photo) | 1 Loudspeaker, 2 Power, MP3 Control (3 Previous/Next, 4 Play/Pause, 5 Stop, 6 MP3 Volume, 7 Sequence/Random/Single, 8 Sound effect), 9 Sync, 10 Fill-in, 11 Timbre, 12 Rhythm, 13 Key Lighting, 14 Demo Song, 15 LCD, 16 Keyboard Percussion, 17 Recording (panel: REC), 18 Program (PROG), 19 Play, 20 Split, 21 Sustain, 22 Vibrato, 23 One Key, 24 Follow, 25 Ensemble, 26 Memory (+ M1/M2/M3 on panel), 27 Numbers (0–9, +, −), 28 Single Chord, 29 Fingered Chord, 30 Chord Timbre, 31 Chord OFF, 32 Metronome, 33 Start/Stop, 34 Master Volume ±, 35 Accom Volume ±, 36 Tempo ±, 37 Transpose ±, 38 Chord Zone ("AUTO BASS CHORD" keys, left end). What each control *does*: still from the manual's later pages |
| Counts | VERIFIED (listing) | 255 tones, 255 rhythms, 50 demo songs, 61 keyboard percussion sounds |
| Teaching modes | VERIFIED names only | **One-Key, Follow, Ensemble** (Amazon images, manuals.plus). Behaviour per summaries: One-Key = press any key and it plays the correct note; Follow = waits for the correct note. **How to enter each mode: UNVERIFIED** |
| Lighted keys | VERIFIED | Light up the notes to play during teaching; can be toggled. Troubleshooting says to use the "KEY LIGHTING"/"Light" button (button label UNVERIFIED) |
| Functions | VERIFIED (listing) | Master vol, accomp vol, tempo, single-finger and fingered chords, sustain, vibrato, split, transpose, metronome, record/playback, status memory, dual keyboard |
| Ports | **VERIFIED** (her manual p.1) | 39 UDISK, 40 AUDIO INPUT, 41 MIC, 42 PHONES/OUTPUT, 43 DC 12V |
| USB MIDI | **VERIFIED: NO** | Her manual lists no MIDI port; UDISK is a flash-drive (MP3) port. **Phase 3 is deferred** |
| Touch-sensitive keys | UNVERIFIED | Not stated anywhere (likely no) |
| Power | **VERIFIED: DC 12V** | Her manual p.1 (the "9V" in a third-party summary was wrong) |
| Reset / factory reset | UNVERIFIED | Only "unplug 60s" (manuals.plus summary) |
| Tone/rhythm/demo **name lists** | UNVERIFIED | The panel prints tones 000–126 and rhythms 000–155. Panel text says "127–254 / 156–254 Refer to the manual". The current photo is too small to transcribe without guessing |

### Photos still needed (for M0 / M4 / M9; you said you can get these later)
1. Straight-on, close-up, well-lit shots of the **left timbre list** and the **right rhythm list** (2–3 photos each are fine)
2. Manual pages: **tone table 127–254**, **rhythm table 156–254**, **demo song list**
3. Manual pages on **One Key / Follow / Ensemble** (how to enter, left/right hand), **Key Lighting**, **Record/Play/Program**, **Metronome**, **Transpose**, **Split**, **Memory**, **reset**, and the **specifications** page (touch sensitivity)

Until they arrive, the profile ships only VERIFIED items. M4 shows button names plus "details coming", and M9 (Sound Explorer) waits.

Sources: amazon.com/dp/B08T61FPTV; manuals.plus/asin/B08T61FPTV; manuals.plus/jikada/jikada-jk-825-61-key-portable-electronic-keyboard-user-guide. Both manuals.plus pages are third-party summaries, not the owner's manual.

**Phase 3 decision:** MIDI is deferred as a future item. The app keeps a `usbMidi` flag in the profile, so a MIDI-capable keyboard later is just a new profile file.

### Licenses (go into `research/licenses.md` in M0)
| Repo | License | Use |
|---|---|---|
| gigliof/bach-to-basics | MIT | OK to borrow, with credit |
| GhanshyamPaunikar/piano-tutor | MIT | OK to borrow, with credit |
| ftrain/sightreading | LGPL-3.0 | Ideas only; don't copy code |
| LukeDowell/flash-chords | **None** (all rights reserved) | Ideas only; no code |
| abcjs, vite-plugin-pwa, React, Vite | MIT | Dependencies |

---

## Stack
**Vite + React + TypeScript + vite-plugin-pwa + abcjs.** That's it.
- No router library. A ~20-line hash router (`#/songs/ode-to-joy`) avoids GitHub Pages 404s on deep links.
- No CSS framework. One `styles.css` with CSS variables. Font: `ui-rounded, system-ui` (SF Pro Rounded on Apple devices, zero downloads, works offline).
- No markdown library. Guides are structured JSON (`title`, `steps[]`).
- Playback uses the abcjs built-in synth (no Tone.js).
- Dev only: Vitest for one test file on the store logic.
- Base path: `base: process.env.BASE_PATH ?? '/'` in `vite.config.ts`. The Actions workflow sets `/piano-professor/`; Vercel uses the default.

## File structure
```
index.html  vite.config.ts  package.json  tsconfig.json  README.md  PLAN.md
.github/workflows/deploy.yml
public/            icons (180 apple-touch, 192, 512, maskable)
research/          keyboard.md, licenses.md, photos/
data/
  keyboards/jikada-61.json      active keyboard profile
  levels.json                   5 levels → exercises, song ids, keyboardTips
  routine.json                  practice segments + durations
  songs/*.json                  one file per song (loaded via import.meta.glob)
src/
  main.tsx  App.tsx (hash router + nav)  styles.css
  store.ts       progress load/save/migrate/export/import, streak, unlock
  store.test.ts
  audio.ts       shared AudioContext unlock + metronome scheduler
  wakeLock.ts    acquire / re-acquire on visibilitychange
  screens/       Today, Practice, Learn, Level, Songs, Song, Keyboard, Sounds, Metronome, Me
  components/    Score (abcjs wrapper), BigButton, Timer
```

## Data model
```ts
// data/keyboards/*.json
KeyboardProfile {
  id, brand, listingName, model, sources[]
  features: { touchSensitive: boolean|null, usbMidi: boolean|null, lightedKeys: true }
  controls: { id, label /* exact panel text */, group, does, verified }[]
  tones|rhythms|demos: { num, name }[]
  teachingModes: { id, name, does, howToEnter: string[], verified }[]
  howTos, troubleshooting: { id, title, steps: string[] }[]
}
// data/songs/*.json
Song { id, title, composer, level, genres[], publicDomain: true, abc /* V:RH / V:LH voices */, bpm,
       soundPairing?: { tone: number, rhythm: number } }
ExternalSong { id, title, level, link }   // modern songs: no notation, ever
// data/levels.json
Level { n, title, goal, items: { id, kind:'exercise'|'song', text|songId, keyboardTip? }[] }
// localStorage "pp:v1"
Progress { version:1, checked: Record<itemId,true>, canPlay: Record<songId, isoDate>,
           log: Record<'YYYY-MM-DD' /*local date*/, minutes>, settings: { keyboardId, name?, bpm } }
```
- Streak and level unlock are derived from `log` and `checked`, never stored.
- Import validates shape and version before overwriting (trust boundary) and keeps the previous data as `pp:v1:backup`.

## Screens (iPad landscape: left nav rail; iPhone: bottom tab bar)
1. **Today**: greeting by her name (asked once on first launch, stored in `settings.name`, editable in Me; generic if blank), streak, one big "Start practice" button, next lesson item.
2. **Practice**: full-screen stepper (warm-up → technique → song → free play). Huge timer, one tap for next/pause, wake lock on. Minutes go to `log`.
3. **Learn / Level**: 5 level cards (locked/unlocked). A checklist with big checkboxes and "Use your keyboard" tips (e.g. Follow mode + lighted keys for L1 songs).
4. **Songs / Song**: filter by level and genre. The song screen shows the abcjs score sized to the screen, play/stop, tempo slider, Both/RH/LH, and a "I can play this!" button.
5. **Keyboard**: control panel built from `controls` (grouped grid shaped like the real panel; tap a button to see what it does), how-tos, troubleshooting.
6. **Sounds**: Sound Explorer cards (song + verified tone + rhythm numbers and names).
7. **Metronome**: giant pulsing beat, BPM ± and tap tempo, accent on beat 1. Web Audio lookahead scheduling.
8. **Me**: stats, songs I can play, settings, Export/Import, "open from the icon" reminder.

iOS gotchas handled: audio unlocks on the first tap; tell her that the iPhone silent switch mutes web audio; call `navigator.storage.persist()`; the home-screen app has separate storage from the Safari tab.

## Milestones (approve one at a time)
- **M0 Research docs**: write `research/keyboard.md`, `licenses.md`, `PLAN.md`, and fold in her photos. *No code.*
- **M1 Skeleton + deploy**: Vite scaffold, `git init`, hash router, nav, theme, Actions to Pages (`BASE_PATH=/piano-professor/`), README deploy steps. **You create the `piano-professor` repo**; I give the exact `git remote`/push commands and Pages settings. ✅ Live URL opens on the iPad.
- **M2 PWA**: manifest, icons, offline service worker, Apple meta tags, wake lock. ✅ Installs from Share → Add to Home Screen and opens in airplane mode.
- **M3 Progress store**: store + test, Me screen, export/import. ✅ `npm test`; export → clear → import restores everything.
- **M4 My Keyboard guide**: profile JSON + Keyboard screen.
- **M5 Songs**: abcjs score, playback, tempo, hands-separate; first ~8 public-domain songs.
- **M6 Metronome.**
- **M7 Levels L1–L5**: content + unlock + keyboard tips.
- **M8 Daily practice routine.**
- **M9 Sound Explorer**: blocked on verified tone/rhythm names.
- **M10 Polish**: iPhone layout, contrast check, encouragement copy, empty states.
- **Future**: Phase 3 MIDI (only with a USB-MIDI keyboard; Web MIDI feature-detected, Mac Chrome only).

## Verification (every milestone)
`npm run build` passes; `npm test` (from M3); push to main, the Action goes green, and the Pages URL loads; then check by hand on the iPad from the home-screen icon (landscape, arm's length readability).
