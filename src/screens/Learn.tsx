import type { ScreenProps } from '../App'
import { isDone, isUnlocked, levelByN, levelProgress, levels, type Level, type LevelItem } from '../levels'
import { setProgress, useProgress, type Progress } from '../store'
import './Learn.css'

export default function Learn({ params }: ScreenProps) {
  const level = params[0] ? levelByN(Number(params[0])) : undefined
  return level ? <LevelPage key={level.n} level={level} /> : <LevelList />
}

function Bar({ done, total }: { done: number; total: number }) {
  return (
    <div className="learn-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      <div className="learn-bar-fill" style={{ width: `${(done / total) * 100}%` }} />
    </div>
  )
}

function LevelList() {
  const p = useProgress()
  return (
    <div className="stack">
      <h1>Learn</h1>
      <p className="lead">Five levels, one small step at a time. Tap a level to see what's inside.</p>
      <div className="learn-grid">
        {levels.map((l) => {
          const { done, total } = levelProgress(l, p)
          const open = isUnlocked(l.n, p)
          return (
            <a key={l.n} href={`#/learn/${l.n}`} className={`card learn-card${open ? '' : ' learn-locked'}`}>
              <span className="learn-num">Level {l.n}{done === total ? ' 🎉' : ''}</span>
              <strong className="learn-card-title">{l.title}</strong>
              <span className="learn-goal">{l.goal}</span>
              <Bar done={done} total={total} />
              <span className="learn-goal">
                {open ? `${done} of ${total} done` : `Finish Level ${l.n - 1} to unlock 🔒 (you can still peek inside)`}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function LevelPage({ level }: { level: Level }) {
  const p = useProgress()
  const open = isUnlocked(level.n, p)
  const { done, total } = levelProgress(level, p)
  const next = levelByN(level.n + 1)

  return (
    <div className="stack">
      <a className="btn btn-quiet learn-back" href="#/learn">← All levels</a>
      <h1>Level {level.n}: {level.title}</h1>
      <p className="lead">{level.intro}</p>
      <Bar done={done} total={total} />

      {!open && (
        <p className="card learn-note">
          🔒 Finish Level {level.n - 1} to unlock this one. Have a look around: it's coming up soon!
        </p>
      )}
      {open && done === total && (
        <div className="card learn-note learn-celebrate">
          <strong>🎉 You finished Level {level.n}! Wonderful work.</strong>
          {next ? (
            <a className="btn" href={`#/learn/${next.n}`}>On to Level {next.n}: {next.title} →</a>
          ) : (
            <span>That's every level. You've built a real foundation; now play the music you love.</span>
          )}
        </div>
      )}

      <div className="learn-items">
        {level.items.map((item) => <Item key={item.id} item={item} p={p} locked={!open} />)}
      </div>
    </div>
  )
}

const toggle = (id: string) =>
  setProgress((p) => {
    const checked = { ...p.checked }
    if (checked[id]) delete checked[id]
    else checked[id] = true
    return { ...p, checked }
  })

function Item({ item, p, locked }: { item: LevelItem; p: Progress; locked: boolean }) {
  const done = isDone(item, p)
  const viaSongs = done && !p.checked[item.id] // marked "I can play this" on the song page
  return (
    <div className={`card learn-item${done ? ' learn-done' : ''}`}>
      <div className="learn-item-head">
        <button
          className="learn-check"
          aria-pressed={done}
          aria-label={`${item.title}: ${done ? 'done' : 'not done yet'}`}
          disabled={locked || viaSongs}
          onClick={() => toggle(item.id)}
        >
          {done ? '✓' : ''}
        </button>
        <strong className="learn-item-title">{item.title}</strong>
      </div>
      {viaSongs && <span className="learn-goal">You marked this "I can play this" on the song page. 🌟</span>}

      {item.steps && (
        <details className="learn-steps">
          <summary>How to do it</summary>
          <ol>{item.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </details>
      )}

      {item.keyboardTip && (
        <div className="learn-tip">
          <strong>🎹 Use your keyboard</strong>
          <p><TipText text={item.keyboardTip} /></p>
        </div>
      )}

      {item.songId && <a className="btn btn-quiet" href={`#/songs/${item.songId}`}>Open song →</a>}
      {item.link && <a className="btn btn-quiet" href={item.link}>Open Songs →</a>}
    </div>
  )
}

/** Renders "[label](#/route)" links inside a tip; everything else stays plain text. */
function TipText({ text }: { text: string }) {
  const parts = text.split(/\[([^\]]+)\]\((#\/[^)]+)\)/) // [text, label, href, text, …]
  return parts.map((s, i) =>
    i % 3 === 1 ? <a key={i} href={parts[i + 1]}>{s}</a> : i % 3 === 2 ? null : s,
  )
}
