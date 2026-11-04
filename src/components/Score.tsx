import { memo, useEffect, useRef } from 'react'
import { renderAbc, type TuneObject } from 'abcjs'
import './Score.css'

type Props = {
  abc: string
  onRender?: (tune: TuneObject) => void
  dimVoice?: 0 | 1 // fade the hand that is muted (0 = RH, 1 = LH)
}

/**
 * abcjs score that fills its container's width. The SVG is drawn only when `abc` changes:
 * `responsive: 'resize'` lets the browser rescale it on width changes, so no redraw there either.
 */
function Score({ abc, onRender, dimVoice }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const cb = useRef(onRender)
  cb.current = onRender

  useEffect(() => {
    const [tune] = renderAbc(el.current!, abc, {
      responsive: 'resize',
      add_classes: true, // abcjs-v0 / abcjs-v1 classes for dimming a hand
      staffwidth: 640, // narrow staff + responsive = big notes: ~1.5x on an iPad in landscape
      wrap: { preferredMeasuresPerLine: 4, minSpacing: 1.8, maxSpacing: 2.7 },
      paddingtop: 0,
      paddingbottom: 0,
    })
    if (tune.warnings?.length) console.warn('ABC warnings', tune.warnings)
    cb.current?.(tune)
  }, [abc])

  return <div ref={el} className="score" data-dim={dimVoice} />
}

export default memo(Score)
