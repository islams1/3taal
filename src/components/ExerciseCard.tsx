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

const dateFmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

function Delta({ prev, cur }: { prev?: number; cur?: string }) {
  const p = prev ?? NaN, c = parseFloat(cur ?? '')
  if (isNaN(p) || isNaN(c) || p === c) return null
  const diff = +(c - p).toFixed(2)
  return <b className={diff > 0 ? 'delta up' : 'delta down'}>{diff > 0 ? `▲ +${diff}` : `▼ ${diff}`}</b>
}

const failText = (f?: Failure) => (f === 'yes' ? 'failure' : f === 'no' ? 'no failure' : null)

export function ExerciseCard({ exercise: ex, entry, previous, onChange = () => {}, readOnly = false }: Props) {
  const facts: [string, string][] = [
    ['W.U', ex.warmupSets || '–'],
    ['Sets', String(ex.workingSets)],
    ['Reps', ex.reps.replace(/\s*reps?/i, '')],
    ['RIR', ex.rir || '–'],
    ['Rest', ex.rest],
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
    const parts = [entry?.cur ? `${entry.cur} kg` : null, `${entry?.done || 0}/${ex.workingSets} sets`, failText(entry?.fail)].filter(Boolean)
    return (
      <article className="ex complete folded">
        <button type="button" className="ex-fold" onClick={() => setOpen(true)} aria-expanded="false">
          <span className="fold-check" aria-hidden="true">✓</span>
          <span className="c-name">{ex.name}</span>
          <span className="fold-sum">{parts.join(' · ')}</span>
          <span className="fold-edit">Edit</span>
        </button>
      </article>
    )
  }

  return (
    <article className={complete ? 'ex complete' : 'ex'}>
      <div className="ex-main">
        <h3 className="c-name">{ex.name}</h3>
        {facts.map(([label, value]) => (
          <span key={label} className="cell">{value}</span>
        ))}
        {ex.video ? (
          <a className="play" href={ex.video} target="_blank" rel="noopener" aria-label={`Watch ${ex.name} video`}>
            <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 2l5 3-5 3z" /></svg>
          </a>
        ) : <span />}
        <div className="chips">
          {facts.map(([label, value]) => (
            <span key={label}><b>{label}</b>{value}</span>
          ))}
        </div>
      </div>

      <div className="ex-track">
        <div className="f f-commit">
          <Ring value={pct} />
          <span className="lbl">Commitment</span>
          {!readOnly && complete && (
            <button type="button" className="fold-btn" onClick={() => setOpen(false)}>Collapse ✓</button>
          )}
        </div>

        <div className="f">
          <span className="lbl">
            Previous weight
            {previous?.date && <span className="u">{dateFmt(previous.date)}</span>}
          </span>
          <span className="inp readonly" title="Current weight from last time">
            <output>{previous ? previous.weight : '–'}</output>
            <em>kg</em>
          </span>
        </div>

        <div className="f">
          <label className="lbl" htmlFor={readOnly ? undefined : `${ex.id}c`}>
            Current weight <span className="u">kg</span>
            <Delta prev={previous?.weight} cur={entry?.cur} />
            {!readOnly && previous && !entry?.cur && (
              <button type="button" className="same-btn" onClick={() => onChange({ cur: String(previous.weight) })}>
                Same as last
              </button>
            )}
          </label>
          {readOnly ? (
            <span className="inp readonly"><output>{entry?.cur || '–'}</output><em>kg</em></span>
          ) : (
            <Stepper id={`${ex.id}c`} label="weight" step={2.5} inputMode="decimal" base={previous?.weight}
              value={entry?.cur ?? ''} onChange={(cur) => onChange({ cur })} />
          )}
        </div>

        <div className="f">
          <label className="lbl" htmlFor={readOnly ? undefined : `${ex.id}s`}>
            Sets done <span className="u">/ {ex.workingSets}</span>
          </label>
          {readOnly ? (
            <span className="inp readonly"><output>{entry?.done || '0'}</output><em>/ {ex.workingSets}</em></span>
          ) : (
            <Stepper id={`${ex.id}s`} label="sets" step={1} inputMode="numeric"
              value={entry?.done ?? ''} onChange={(done) => onChange({ done })} />
          )}
        </div>

        <div className="f">
          <span className="lbl">Reached failure?</span>
          <div className={readOnly ? 'yn readonly' : 'yn'} role="group" aria-label="Reached failure?">
            <button type="button" data-v="yes" aria-pressed={entry?.fail === 'yes'} disabled={readOnly} onClick={() => setFail('yes')}>YES</button>
            <button type="button" data-v="no" aria-pressed={entry?.fail === 'no'} disabled={readOnly} onClick={() => setFail('no')}>NO</button>
          </div>
        </div>
      </div>
    </article>
  )
}
