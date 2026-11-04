# Her keyboard: JIKADA JK-825

Rule: every fact is **VERIFIED** (with source) or **UNVERIFIED**. Nothing here is invented. The app's profile (`data/keyboards/jikada-61.json`) may only use VERIFIED names and numbers.

## Sources
| ID | Source | Notes |
|---|---|---|
| S1 | Her **owner's manual, page 1** ("I. Panel Control and External Ports"), photo sent 2026-11-04 | Primary. Store a copy as `research/photos/manualp1.jpg` |
| S2 | Her **top-panel photo**, sent 2026-11-04 | Primary. Store as `research/photos/paneltop.jpg` |
| S3 | Amazon listing https://www.amazon.com/dp/B08T61FPTV | Seller copy, not always precise |
| S4 | manuals.plus/asin/B08T61FPTV and manuals.plus/jikada/jikada-jk-825-61-key-portable-electronic-keyboard-user-guide | Third-party *summaries*, not the real manual; weakest source |

## Identity
| Item | Status | Value |
|---|---|---|
| Model | VERIFIED (S2) | **JK-825**, "61-KEY LIGHTING ELECTRONIC KEYBOARD", "KEY LIGHTING 3-STEP LESSON" |
| Listing name | VERIFIED (S3) | "JIKADA-61", ASIN B08T61FPTV. Same product, marketing name only |
| Keys | VERIFIED (S2, S3) | 61, lighted |
| Counts | VERIFIED (S2) | 255 timbres, 255 rhythms, 50 songs |
| Percussion | VERIFIED (S3) | 61 keyboard percussion sounds |
| Power | VERIFIED (S1) | DC 12V (S4 says 9V, which is wrong) |
| Touch-sensitive keys | **UNVERIFIED** | Not stated anywhere. There is no touch-response button among the 43 controls in S1, which suggests no. Check the specs page |

## Controls (VERIFIED, S1 numbering; panel text from S2 in parentheses)
| # | Name | What it does |
|---|---|---|
| 1 | Loudspeaker | Built-in speakers (two) |
| 2 | Power (POWER, ON/OFF) | Turns the keyboard on or off |
| 3 | Previous/Next | MP3 control for the UDISK player. Exact behaviour UNVERIFIED |
| 4 | Play/Pause | MP3 control. UNVERIFIED detail |
| 5 | Stop | MP3 control. UNVERIFIED detail |
| 6 | MP3 Volume Control | MP3 control. UNVERIFIED detail |
| 7 | Sequence/Random/Single | MP3 play order. UNVERIFIED detail |
| 8 | Sound effect (EFFECT) | MP3 control. UNVERIFIED detail |
| 9 | Sync (SYNC) | UNVERIFIED: typically starts the rhythm when you play a chord-zone key |
| 10 | Fill-in (FILL-IN) | UNVERIFIED detail |
| 11 | Timbre (TIMBRE) | Selects the tone. Number entry detail UNVERIFIED |
| 12 | Rhythm (RHYTHM) | Selects the rhythm. UNVERIFIED detail |
| 13 | Key Lighting (KEY LIGHTING) | Turns key lights on/off (S3/S4; VERIFIED name, behaviour per listing) |
| 14 | Demo Song (DEMO SONG) | Plays demo songs. UNVERIFIED detail |
| 15 | LCD display | Shows status |
| 16 | Keyboard Percussion (KEYBOARD PERCUSSION) | Keys play drum sounds (61 percussion, S3). UNVERIFIED detail |
| 17 | Recording (REC) | Record (S3). Steps UNVERIFIED |
| 18 | Program (PROG) | UNVERIFIED |
| 19 | Play (PLAY) | Play back a recording (S3). Steps UNVERIFIED |
| 20 | Split (SPLIT) | Two sounds on the left and right of the keyboard (S3/S4). Steps UNVERIFIED |
| 21 | Sustain (SUSTAIN) | Notes ring longer (S3). Toggle |
| 22 | Vibrato (VIBRATO) | Adds vibrato (S3). Toggle |
| 23 | One Key (ONE-KEY) | Teaching mode 1. See below |
| 24 | Follow (FOLLOW) | Teaching mode 2. See below |
| 25 | Ensemble (ENSEMBLE) | Teaching mode 3. See below |
| 26 | Memory (MEMORY, M1, M2, M3) | Saves tone/rhythm/tempo settings (S3) |
| 27 | Numbers (0–9, +, −) | Number entry for tone, rhythm, song |
| 28 | Single Chord (SINGLE CHORD) | One-finger auto chords (S3) |
| 29 | Fingered Chord (FINGERED CHORD) | Full-chord auto accompaniment (S3) |
| 30 | Chord Timbre (CHORD TIMBRE) | UNVERIFIED |
| 31 | Chord OFF (CHORD OFF) | Turns auto chords off |
| 32 | Metronome (METRONOME) | Metronome (S3). Steps UNVERIFIED |
| 33 | Start/Stop (START/STOP) | Starts/stops rhythm (likely). UNVERIFIED |
| 34 | Master Volume (MASTER VOL −/+) | Overall volume |
| 35 | Accom Volume (ACCOM VOL −/+) | Accompaniment volume |
| 36 | Tempo (TEMPO −/+) | Rhythm/demo speed |
| 37 | Transpose (TRANSPOSE −/+) | Shifts pitch. Reset value "00" per S4 is UNVERIFIED |
| 38 | Chord Zone ("+ AUTO BASS CHORD") | Left-end keys used for auto chords. Range UNVERIFIED |

## Rear ports (VERIFIED, S1)
| # | Port | Use |
|---|---|---|
| 39 | UDISK (USB-A) | USB flash drive with MP3s ("UDISK Music Player" on panel) |
| 40 | AUDIO INPUT | Play a phone/tablet through the speakers |
| 41 | MIC | Included microphone |
| 42 | PHONES/OUTPUT | Headphones; mutes the speakers (S4) |
| 43 | DC 12V | Power adapter |

## USB MIDI: **VERIFIED: NOT SUPPORTED**
S1 lists every port; the only USB is UDISK, a flash-drive (host) port. MIDI to a computer needs a USB-B "to Host" port or 5-pin MIDI OUT, and this keyboard has neither, so no adapter can add it. **Phase 3 (Web MIDI) is deferred** until she has a MIDI-capable keyboard. The profile sets `usbMidi: false`.

## Teaching modes
| Mode | Name | Behaviour | How to enter |
|---|---|---|---|
| One Key | VERIFIED (S1, S2) | Press any key and the keyboard plays the correct next note (S4, UNVERIFIED) | UNVERIFIED |
| Follow | VERIFIED (S1, S2) | Waits for her to play the correct (lit) note (S4, UNVERIFIED) | UNVERIFIED |
| Ensemble | VERIFIED (S1, S2) | Play along with the accompaniment (S4, UNVERIFIED) | UNVERIFIED |

Which songs work with the teaching modes (all 50 demos?), and left-hand vs right-hand practice: UNVERIFIED.

## Lighted keys
VERIFIED (S3): keys light to show which notes to play during lessons. On/off via KEY LIGHTING (S1 name). Whether keys light during free play: UNVERIFIED.

## Lists
- **Timbres: VERIFIED (S2) for 000–131 except 115.** Transcribed from enlarged crops of the top-panel photo into `data/keyboards/jikada-61.json` (`tones`). Correction: the panel prints 000–131 (not 000–126) and reads "132-254 Refer to the manual". 000 is "Acoustic Grand Piano" (confirmed). Skipped as not legible: 115 ("Mellow F? 1"). 103 "Uillean Harp 1" confirmed on a sharper crop during review; 078 is printed "Shakuhach" (no final i). Spellings kept as printed, e.g. 107/120 "Wood Barafon", 102 "Feedback Gt. 1", 127 "12-str. Gt 1".
- **Rhythms: VERIFIED (S2) for 000–155 except 109, 110, 133, 143.** Transcribed into the profile (`rhythms`). The panel reads "156-254 Refer to the manual". Skipped as not legible: 109, 110 ("Pasodobl?"), 133 ("Espag Nol 1"?), 143 ("Fanatical Sand"?). Abbreviations kept as printed, e.g. 064 "8 Bt Rock Balld", 093 "Cntry Ballad", 075 "Reggae 12".
- **Timbres 132–254, rhythms 156–254, demo songs (50):** UNVERIFIED, need the manual pages.

## Troubleshooting (S4, UNVERIFIED until checked against the manual)
- No sound: power on, volume up, unplug headphones (speakers mute when plugged in), check the adapter.
- Keys don't light: KEY LIGHTING on; be in a teaching mode.
- Pitch sounds wrong: transpose is active, so set it back to 0.
- Sustain won't stop: turn SUSTAIN off.
- Frozen: unplug for 60 s, then restart. **Factory reset procedure: UNVERIFIED.**

## Open questions for you (photos)
1. Close-up, straight-on photos of the left timbre list and the right rhythm list on the panel.
2. Manual pages: timbre table 127–254, rhythm table 156–254, demo song list.
3. Manual pages for One Key / Follow / Ensemble, Key Lighting, Record/Play/Program, Metronome, Transpose, Split, Memory, Sync/Fill-in, reset, and the specifications page (touch response).
4. ~~Save the two photos~~ Done: `research/photos/manualp1.jpg`, `research/photos/paneltop.jpg`.
