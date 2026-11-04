import { useEffect, useState } from 'react'
import data from '../../data/sound-pairings.json'
import { useProgress } from '../store'
import { activeKeyboard, type Numbered } from '../keyboard'
import { songById } from '../songs'
import './Sounds.css'

// Names are looked up from the keyboard profile by number, never stored here (THE RULE).
type Pairing = { id: string; emoji: string; songId: string | null; tone: number; rhythm?: number; idea: string; tempoHint?: string }
const pairings: Pairing[] = data

const pad = (n: number) => String(n).padStart(3, '0')
const levelOf = (p: Pairing) => (p.songId ? songById(p.songId)?.level : undefined)
const LEVELS = [...new Set(pairings.map(levelOf).filter((l) => l !== undefined))].sort((a, b) => a - b)

type Filter = 'all' | 'free' | number

export default function Sounds() {
  useProgress() // re-render if she switches keyboards
  const kb = activeKeyboard()
  const [filter, setFilter] = useState<Filter>('all')
  const [picked, setPicked] = useState<string>()
  const [query, setQuery] = useState('')

  const name = (list: Numbered[], n: number) => list.find((x) => x.num === n)?.name
  const shown = pairings.filter((p) =>
    filter === 'all' ? true : filter === 'free' ? !p.songId : levelOf(p) === filter,
  )

  function surprise() {
    setFilter('all')
    const others = pairings.filter((p) => p.id !== picked)
    setPicked(others[Math.floor(Math.random() * others.length)].id)
  }
  useEffect(() => {
    if (picked) document.getElementById(`snd-${picked}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [picked])

  const q = query.trim().toLowerCase()
  const match = (list: Numbered[]) => list.filter((x) => x.name.toLowerCase().includes(q) || pad(x.num).includes(q))

  return (
    <div className="stack">
      <header className="snd-head">
        <div>
          <h1>Sound Explorer 🎨</h1>
          <p className="lead">Your keyboard has {kb.counts.tones} sounds. Here are some fun combos to try.</p>
        </div>
        <button type="button" className="btn snd-surprise" onClick={surprise}>Surprise me 🎲</button>
      </header>

      <div className="row" role="group" aria-label="Show">
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        {LEVELS.map((n) => <Chip key={n} on={filter === n} onClick={() => setFilter(n)}>Level {n}</Chip>)}
        <Chip on={filter === 'free'} onClick={() => setFilter('free')}>Free play</Chip>
      </div>

      <div className="snd-grid">
        {shown.map((p) => {
          const song = p.songId ? songById(p.songId) : undefined
          return (
            <article key={p.id} id={`snd-${p.id}`} className={`card snd-card${p.id === picked ? ' is-picked' : ''}`}>
              <span className="snd-emoji" aria-hidden="true">{p.emoji}</span>
              <h2 className="snd-title">
                {song ? <a href={`#/songs/${song.id}`}>{song.title}</a> : 'Free play'}
              </h2>
              <p className="snd-line">🎹 Tone {pad(p.tone)} · {name(kb.tones, p.tone)}</p>
              {p.rhythm !== undefined && <p className="snd-line">🥁 Rhythm {pad(p.rhythm)} · {name(kb.rhythms, p.rhythm)}</p>}
              <p className="snd-idea">{p.idea}</p>
              {p.tempoHint && <p className="snd-hint">⏱️ {p.tempoHint}</p>}
              <p className="snd-help">
                <a href="#/keyboard/control/timbre">How do I pick a tone?</a>
                {p.rhythm !== undefined && <a href="#/keyboard/control/rhythm">How do I pick a rhythm?</a>}
              </p>
            </article>
          )
        })}
      </div>

      <section className="stack">
        <h2>Browse all sounds</h2>
        <input
          className="snd-search"
          type="search"
          placeholder="Search, e.g. flute or waltz"
          aria-label="Search sounds and rhythms"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="snd-browse">
          <List title="🎹 Tones" items={match(kb.tones)} />
          <List title="🥁 Rhythms" items={match(kb.rhythms)} />
        </div>
        <p className="snd-help">
          <a href="#/keyboard/control/timbre">How do I pick a tone?</a>
          <a href="#/keyboard/control/rhythm">How do I pick a rhythm?</a>
        </p>
      </section>
    </div>
  )
}

function List({ title, items }: { title: string; items: Numbered[] }) {
  return (
    <div className="card">
      <h3>{title} ({items.length})</h3>
      {items.length ? (
        <ul className="snd-list">
          {items.map((x) => <li key={x.num}><b>{pad(x.num)}</b> {x.name}</li>)}
        </ul>
      ) : (
        <p className="snd-hint">Nothing matches.</p>
      )}
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={`btn snd-chip${on ? '' : ' btn-quiet'}`} aria-pressed={on} onClick={onClick}>{children}</button>
}
