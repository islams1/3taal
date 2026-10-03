import type { Exercise } from '../data/plan'
import type { ExerciseLog, Failure } from '../hooks/useWorkoutLog'
import { exerciseScore, minReps, setsComplete } from '../lib/score'
import { Ring } from './Ring'
import { Stepper } from './Stepper'

type Props = {
  exercise: Exercise
  entry: ExerciseLog | undefined
  previous?: { weight: number; date?: string }
  /** open = full card; closed = one summary line (the day shows one exercise open at a time) */
  open: boolean
  onToggle: () => void
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

export function ExerciseCard({ exercise: ex, entry, previous, open, onToggle, onChange = () => {}, readOnly = false }: Props) {
  const facts: [string, string][] = [
    ['W.U', ex.warmupSets || '–'],
    ['Sets', String(ex.workingSets)],
    ['Reps', ex.reps.replace(/\s*reps?/i, '')],
    ['RIR', ex.rir || '–'],
    ['Rest', ex.rest],
  ]
  const setFail = (v: Failure) => onChange({ fail: entry?.fail === v ? null : v })
  const score = exerciseScore(entry, ex, previous?.weight)
  const done = setsComplete(entry, ex)
  const started = !!(entry?.cur || entry?.reps || entry?.done || entry?.fail)
  const missing = started ? [
    score.sets < 100 && 'sets not finished',
    score.reps < 100 && (entry?.reps ? 'reps below target' : 'reps not logged'),
    score.weight < 100 && (entry?.cur ? 'weight below last time' : 'weight not logged'),
  ].filter(Boolean) : []
  const scoreTitle = `Sets ${score.sets}% · Reps ${score.reps}% · Weight ${score.weight}%`

  if (!open) {
    const logged = [
      entry?.cur ? `${entry.cur} kg` : null,
      entry?.reps ? `${entry.reps} reps` : null,
      started ? `${entry?.done || 0}/${ex.workingSets} sets` : null,
      failText(entry?.fail),
    ].filter(Boolean)
    const plan = [`${ex.workingSets} × ${ex.reps.replace(/\s*reps?/i, '')}`, previous ? `last ${previous.weight} kg` : null].filter(Boolean)
    return (
      <article className={`ex ex-closed${done ? ' complete' : started ? ' started' : ''}`}>
        <button type="button" className="ex-row" onClick={onToggle} aria-expanded="false">
          {done ? <span className="fold-check" aria-hidden="true">✓</span> : <Ring value={score.total} />}
          <span className="ex-row-text">
            <span className="c-name">{ex.name}</span>
            <span className="fold-sum">{(started ? logged : plan).join(' · ')}</span>
          </span>
          {done && <Ring value={score.total} />}
          <span className="fold-edit">{readOnly ? 'Details' : done ? 'Edit' : started ? 'Continue' : 'Start'}</span>
        </button>
      </article>
    )
  }

  return (
    <article className={done ? 'ex complete' : 'ex'}>
      <div className="ex-main">
        <button type="button" className="c-name ex-title" onClick={onToggle} aria-expanded="true" title={scoreTitle}>
          <Ring value={score.total} />
          <span>{ex.name}</span>
        </button>
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
          <label className="lbl" htmlFor={readOnly ? undefined : `${ex.id}r`}>
            Reps <span className="u">lowest set · target {ex.reps.replace(/\s*reps?/i, '')}</span>
          </label>
          {readOnly ? (
            <span className="inp readonly"><output>{entry?.reps || '–'}</output><em>reps</em></span>
          ) : (
            <Stepper id={`${ex.id}r`} label="reps" step={1} inputMode="numeric" placeholder={ex.reps.replace(/\s*reps?/i, '')}
              base={minReps(ex) || undefined} startAtBase
              value={entry?.reps ?? ''} onChange={(reps) => onChange({ reps })} />
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

        {missing.length > 0 && (
          <p className="score-note">
            {score.total}% · {missing.join(' · ')}
          </p>
        )}
      </div>
    </article>
  )
}
