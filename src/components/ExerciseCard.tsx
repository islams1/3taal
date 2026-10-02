import type { Exercise } from '../data/plan'
import { commitment, type ExerciseLog, type Failure } from '../hooks/useWorkoutLog'
import { Ring } from './Ring'
import { Stepper } from './Stepper'

type Props = {
  exercise: Exercise
  entry: ExerciseLog | undefined
  previous?: { weight: number; date: string }
  onChange: (patch: ExerciseLog) => void
}

function Delta({ prev, cur }: { prev?: number; cur?: string }) {
  const p = prev ?? NaN, c = parseFloat(cur ?? '')
  if (isNaN(p) || isNaN(c) || p === c) return null
  const diff = +(c - p).toFixed(2)
  return <b className={diff > 0 ? 'delta up' : 'delta down'}>{diff > 0 ? `▲ +${diff}` : `▼ ${diff}`}</b>
}

export function ExerciseCard({ exercise: ex, entry, previous, onChange }: Props) {
  const facts: [string, string][] = [
    ['W.U', ex.warmupSets || '–'],
    ['Sets', String(ex.workingSets)],
    ['Reps', ex.reps],
    ['RIR', ex.rir || '–'],
    ['Rest', ex.rest],
  ]
  const setFail = (v: Failure) => onChange({ fail: entry?.fail === v ? null : v })
  const pct = commitment(entry, ex.workingSets)

  return (
    <article className={pct >= 100 ? 'ex complete' : 'ex'}>
      <div className="ex-main">
        <h3 className="c-name">{ex.name}</h3>
        {facts.map(([label, value]) => (
          <span key={label} className="cell">{value}</span>
        ))}
        <a className="play" href={ex.video} target="_blank" rel="noopener" aria-label={`Watch ${ex.name} video`}>
          <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 2l5 3-5 3z" /></svg>
        </a>
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
        </div>

        <div className="f">
          <span className="lbl">
            Previous weight
            {previous && <span className="u">{new Date(previous.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>}
          </span>
          <span className="inp readonly" title="Last session's current weight (from Google Sheet)">
            <output>{previous ? previous.weight : '–'}</output>
            <em>kg</em>
          </span>
        </div>

        <div className="f">
          <label className="lbl" htmlFor={`${ex.id}c`}>
            Current weight <span className="u">kg</span>
            <Delta prev={previous?.weight} cur={entry?.cur} />
          </label>
          <Stepper id={`${ex.id}c`} label="weight" step={2.5} inputMode="decimal"
            value={entry?.cur ?? ''} onChange={(cur) => onChange({ cur })} />
        </div>

        <div className="f">
          <label className="lbl" htmlFor={`${ex.id}s`}>
            Sets done <span className="u">/ {ex.workingSets}</span>
          </label>
          <Stepper id={`${ex.id}s`} label="sets" step={1} inputMode="numeric"
            value={entry?.done ?? ''} onChange={(done) => onChange({ done })} />
        </div>

        <div className="f">
          <span className="lbl">Reached failure?</span>
          <div className="yn" role="group" aria-label="Reached failure">
            <button type="button" data-v="yes" aria-pressed={entry?.fail === 'yes'} onClick={() => setFail('yes')}>YES</button>
            <button type="button" data-v="no" aria-pressed={entry?.fail === 'no'} onClick={() => setFail('no')}>NO</button>
          </div>
        </div>
      </div>
    </article>
  )
}
