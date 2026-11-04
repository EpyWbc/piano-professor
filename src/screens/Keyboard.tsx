import { useEffect, useRef, type CSSProperties } from 'react'
import type { ScreenProps } from '../App'
import { useProgress } from '../store'
import { activeKeyboard, type Control, type ControlGroup, type KeyboardProfile, type SourceId } from '../keyboard'
import './Keyboard.css'

// Clusters in roughly the order they sit on the real panel; Keyboard.css places them (grid areas = group ids).
const GROUPS: [ControlGroup, string][] = [
  ['power', 'Power'],
  ['mp3', 'MP3 player'],
  ['chords', 'Auto chords'],
  ['sound', 'Sounds & rhythms'],
  ['display', 'Screen'],
  ['effects', 'Effects & recording'],
  ['volume-tempo', 'Volume & speed'],
  ['lesson', 'Lessons'],
  ['numbers', 'Numbers & memory'],
  ['keys', 'Speakers & keys'],
  ['ports', 'Back of the keyboard'],
]

const COMING_SOON = 'Details coming soon 📷'

function Badge({ kb, verified, source }: { kb: KeyboardProfile; verified: boolean; source?: SourceId }) {
  const name = kb.sources.find((s) => s.id === source)?.name ?? 'an unknown source'
  return verified ? (
    <span className="kb-badge kb-badge-ok">✓ Checked: {name}</span>
  ) : (
    <span className="kb-badge kb-badge-unsure">From {name}, not yet confirmed in your manual</span>
  )
}

const controlHref = (c: Control, selected?: Control) => (c === selected ? '#/keyboard' : `#/keyboard/control/${c.id}`)

export default function Keyboard({ params }: ScreenProps) {
  useProgress() // re-render if she switches keyboards
  const kb = activeKeyboard()
  const [kind, id] = params
  const selected = kind === 'control' ? kb.controls.find((c) => c.id === id) : undefined
  const byNum = (n: number) => kb.controls.find((c) => c.num === n)

  const detailRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    detailRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    if (kind === 'howto') document.getElementById(`kb-howto-${id}`)?.scrollIntoView({ block: 'start' })
  }, [kind, id])

  const chip = (n: number) => {
    const c = byNum(n)
    return c && <a key={n} className="kb-chip" href={`#/keyboard/control/${c.id}`}>{c.label}</a>
  }

  return (
    <div className="stack">
      <header>
        <h1>My Keyboard</h1>
        <p className="lead">{kb.brand} {kb.model}. Tap any button to see what it does.</p>
      </header>

      <div className="kb-panel" role="group" aria-label={`${kb.model} control panel`}>
        {GROUPS.map(([group, title]) => {
          const controls = kb.controls
            .filter((c) => c.group === group)
            .sort((a, b) => a.panel.row - b.panel.row || a.panel.col - b.panel.col)
          if (!controls.length) return null
          const cols = Math.max(...controls.map((c) => c.panel.col))
          return (
            <section key={group} className="kb-cluster" style={{ gridArea: group }}>
              <h2 className="kb-cluster-title">{title}</h2>
              <div className="kb-keys" style={{ '--cols': cols } as CSSProperties}>
                {controls.map((c) => (
                  <a
                    key={c.id}
                    href={controlHref(c, selected)}
                    className={`kb-key${group === 'display' ? ' kb-lcd' : ''}`}
                    aria-current={c === selected ? 'true' : undefined}
                    style={{ '--r': c.panel.row, '--c': c.panel.col } as CSSProperties}
                  >
                    <span className="kb-key-label">{c.label.replaceAll('/', '/​') /* zero-width space: lets "Sequence/Random/Single" wrap at slashes */}</span>
                    <span className="kb-key-num">{c.num}</span>
                  </a>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div ref={detailRef} aria-live="polite">
        {selected ? (
          <article className="card kb-detail">
            <div className="row kb-detail-head">
              <h2>{selected.label}</h2>
              <span className="kb-key-num">#{selected.num} in your manual</span>
              <a className="btn btn-quiet kb-close" href="#/keyboard">Close</a>
            </div>
            {selected.does ? (
              <>
                <p className="kb-does">{selected.does}</p>
                <Badge kb={kb} verified={selected.verified} source={selected.source} />
              </>
            ) : (
              <p className="kb-does">{COMING_SOON}</p>
            )}
            {kb.howTos.some((h) => h.controls.includes(selected.num)) && (
              <p className="row">
                See:{' '}
                {kb.howTos
                  .filter((h) => h.controls.includes(selected.num))
                  .map((h) => <a key={h.id} className="kb-chip" href={`#/keyboard/howto/${h.id}`}>{h.title}</a>)}
              </p>
            )}
          </article>
        ) : (
          <p className="kb-hint">👆 Tap a button above. Numbers match the diagram on page 1 of your manual.</p>
        )}
      </div>

      <div className="kb-columns">
        <section className="stack">
          <h2>How do I…</h2>
          {kb.howTos.map((h) => (
            <details key={h.id} id={`kb-howto-${h.id}`} className="card kb-details" open={kind === 'howto' && id === h.id}>
              <summary>{h.title}</summary>
              {h.steps.length > 0 && <ol>{h.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
              {h.comingSoon && <p className="kb-soon">Step-by-step: {COMING_SOON}</p>}
              <ul className="kb-facts">
                {h.notes.map((n) => (
                  <li key={n.text}>
                    {n.text} <Badge kb={kb} verified={n.verified} source={n.source} />
                  </li>
                ))}
              </ul>
              {h.id === 'teaching-modes' && (
                <ul className="kb-facts">
                  {kb.teachingModes.map((m) => (
                    <li key={m.id}>
                      <strong>{m.name}:</strong> {m.does} <Badge kb={kb} verified={m.verified} source={m.source} />
                      <br />
                      How to start it:{' '}
                      {m.howToEnter.length ? m.howToEnter.join(' → ') : COMING_SOON}
                    </li>
                  ))}
                </ul>
              )}
              <p className="row">Buttons: {h.controls.map(chip)}</p>
            </details>
          ))}
        </section>

        <div className="stack">
          <section className="stack">
            <h2>Something wrong?</h2>
            {kb.troubleshooting.map((t) => (
              <details key={t.id} className="card kb-details">
                <summary>{t.title}</summary>
                <ul className="kb-facts">
                  {t.steps.map((s) => (
                    <li key={s.text}>
                      {s.comingSoon ? (
                        <>{s.text}: {COMING_SOON}</>
                      ) : (
                        <>
                          {s.text} <Badge kb={kb} verified={s.verified} source={s.source} />
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </section>

          <section className="card kb-about">
            <h2>About your keyboard</h2>
            <ul>
              <li>
                <strong>{kb.brand} {kb.model}</strong> (sold as “{kb.listingName}”)
              </li>
              <li>
                {kb.counts.keys} {kb.features.lightedKeys ? 'lighted ' : ''}keys · {kb.counts.tones} sounds · {kb.counts.rhythms} rhythms · {kb.counts.demos} songs
              </li>
              <li>
                Touch-sensitive keys:{' '}
                {kb.features.touchSensitive === null ? 'not confirmed yet' : kb.features.touchSensitive ? 'yes' : 'no'}
              </li>
              {kb.features.usbMidi === false && (
                <li>
                  No USB MIDI port, so this app can't hear what you play. Live note feedback isn't possible with this model,
                  but you can still use the keyboard's own lessons alongside this app.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
