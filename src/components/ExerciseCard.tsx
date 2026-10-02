import { useEffect, useRef, useState } from 'react'
import type { Exercise } from '../data/plan'
import { commitment, type ExerciseLog, type Failure } from '../hooks/useWorkoutLog'
import { Ring } from './Ring'
import { Stepper } from './Stepper'

type Props = {
  exercise: Exercise
  entry: ExerciseLog | undefined
  previous?: { weight: number; date?: string }
  onChange?: (patch: ExerciseLog) => void
  /** history view: same layout, values shown but not editable */
  readOnly?: boolean
}

const dateFmt = (iso: string) => new Date(iso).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'short' })

function Delta({ prev, cur }: { prev?: number; cur?: string }) {
  const p = prev ?? NaN, c = parseFloat(cur ?? '')
  if (isNaN(p) || isNaN(c) || p === c) return null
  const diff = +(c - p).toFixed(2)
  return <b className={diff > 0 ? 'delta up' : 'delta down'} dir="ltr">{diff > 0 ? `▲ +${diff}` : `▼ ${diff}`}</b>
}

const failText = (f?: Failure) => (f === 'yes' ? 'فيلر' : f === 'no' ? 'من غير فيلر' : null)

export function ExerciseCard({ exercise: ex, entry, previous, onChange = () => {}, readOnly = false }: Props) {
  const facts: [string, string][] = [
    ['إحماء', ex.warmupSets || '–'],
    ['مجاميع', String(ex.workingSets)],
    ['عدات', ex.reps.replace(/\s*reps?/i, '')],
    ['RIR', ex.rir || '–'],
    ['راحة', ex.rest.replace('min', 'د')],
  ]
  const setFail = (v: Failure) => onChange({ fail: entry?.fail === v ? null : v })
  const pct = commitment(entry, ex.workingSets)
  const complete = pct >= 100

  // a finished exercise folds into one line so the next one is in view; tap to reopen
  const [open, setOpen] = useState(readOnly || !complete)
  const wasComplete = useRef(complete)
  useEffect(() => {
    if (readOnly) return
    if (complete && !wasComplete.current) {
      wasComplete.current = true
      const t = setTimeout(() => setOpen(false), 700) // let the ring reach 100% first
      return () => clearTimeout(t)
    }
    if (!complete) setOpen(true)
    wasComplete.current = complete
  }, [complete, readOnly])

  if (!open) {
    const parts = [entry?.cur ? `${entry.cur} كجم` : null, `${entry?.done || 0}/${ex.workingSets} مجاميع`, failText(entry?.fail)].filter(Boolean)
    return (
      <article className="ex complete folded">
        <button type="button" className="ex-fold" onClick={() => setOpen(true)} aria-expanded="false">
          <span className="fold-check" aria-hidden="true">✓</span>
          <span className="c-name" dir="ltr">{ex.name}</span>
          <span className="fold-sum">{parts.join(' · ')}</span>
          <span className="fold-edit">تعديل</span>
        </button>
      </article>
    )
  }

  return (
    <article className={complete ? 'ex complete' : 'ex'}>
      <div className="ex-main">
        <h3 className="c-name" dir="ltr">{ex.name}</h3>
        {facts.map(([label, value]) => (
          <span key={label} className="cell"><bdi dir="ltr">{value}</bdi></span>
        ))}
        {ex.video ? (
          <a className="play" href={ex.video} target="_blank" rel="noopener" aria-label={`فيديو ${ex.name}`}>
            <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 2l5 3-5 3z" /></svg>
          </a>
        ) : <span />}
        <div className="chips">
          {facts.map(([label, value]) => (
            <span key={label}><b>{label}</b><bdi dir="ltr">{value}</bdi></span>
          ))}
        </div>
      </div>

      <div className="ex-track">
        <div className="f f-commit">
          <Ring value={pct} />
          <span className="lbl">الالتزام</span>
          {!readOnly && complete && (
            <button type="button" className="fold-btn" onClick={() => setOpen(false)}>اقفل ✓</button>
          )}
        </div>

        <div className="f">
          <span className="lbl">
            الوزن السابق
            {previous?.date && <span className="u">{dateFmt(previous.date)}</span>}
          </span>
          <span className="inp readonly" title="الوزن الحالي من آخر مرة">
            <output>{previous ? previous.weight : '–'}</output>
            <em>كجم</em>
          </span>
        </div>

        <div className="f">
          <label className="lbl" htmlFor={readOnly ? undefined : `${ex.id}c`}>
            الوزن الحالي <span className="u">كجم</span>
            <Delta prev={previous?.weight} cur={entry?.cur} />
            {!readOnly && previous && !entry?.cur && (
              <button type="button" className="same-btn" onClick={() => onChange({ cur: String(previous.weight) })}>
                زي آخر مرة
              </button>
            )}
          </label>
          {readOnly ? (
            <span className="inp readonly"><output>{entry?.cur || '–'}</output><em>كجم</em></span>
          ) : (
            <Stepper id={`${ex.id}c`} label="الوزن" step={2.5} inputMode="decimal" base={previous?.weight}
              value={entry?.cur ?? ''} onChange={(cur) => onChange({ cur })} />
          )}
        </div>

        <div className="f">
          <label className="lbl" htmlFor={readOnly ? undefined : `${ex.id}s`}>
            المجاميع اللي لعبتها <span className="u">من {ex.workingSets}</span>
          </label>
          {readOnly ? (
            <span className="inp readonly"><output>{entry?.done || '0'}</output><em>/ {ex.workingSets}</em></span>
          ) : (
            <Stepper id={`${ex.id}s`} label="المجاميع" step={1} inputMode="numeric"
              value={entry?.done ?? ''} onChange={(done) => onChange({ done })} />
          )}
        </div>

        <div className="f">
          <span className="lbl">وصلت للفيلر؟</span>
          <div className={readOnly ? 'yn readonly' : 'yn'} role="group" aria-label="وصلت للفيلر؟">
            <button type="button" data-v="yes" aria-pressed={entry?.fail === 'yes'} disabled={readOnly} onClick={() => setFail('yes')}>نعم</button>
            <button type="button" data-v="no" aria-pressed={entry?.fail === 'no'} disabled={readOnly} onClick={() => setFail('no')}>لا</button>
          </div>
        </div>
      </div>
    </article>
  )
}
