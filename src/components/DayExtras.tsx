import type { DayExtras } from '../hooks/useWorkoutLog'
import { overallCommitment } from '../hooks/useWorkoutLog'
import { Ring } from './Ring'

const TEN = Array.from({ length: 10 }, (_, i) => i + 1)
const QUESTIONS: { key: keyof DayExtras; title: string; ar: string }[] = [
  { key: 'cardio', title: 'الالتزام بالكارديو', ar: 'التزامك بالكارديو النهارده كام من ١٠؟' },
  { key: 'diet', title: 'الالتزام بالدايت', ar: 'التزامك بالدايت النهارده كام من ١٠؟' },
]

const pct = (v?: number | null) => (v == null ? null : v * 10)

/** Training / cardio / diet percentages side by side, plus the overall day score. */
export function ScoreStrip({ training, extras }: { training: number; extras: DayExtras }) {
  const items: [string, number | null][] = [
    ['التمرين', training],
    ['الكارديو', pct(extras.cardio)],
    ['الدايت', pct(extras.diet)],
  ]
  return (
    <div className="score-strip" aria-label="تفاصيل الالتزام">
      {items.map(([label, v]) => (
        <div key={label} className={v == null ? 'score-item empty' : 'score-item'}>
          {v == null ? <span className="ring ring-empty"><b>–</b></span> : <Ring value={v} />}
          <span className="lbl">{label}</span>
        </div>
      ))}
      <div className="score-item total">
        <Ring value={overallCommitment(training, extras.cardio, extras.diet)} big />
        <span className="lbl">إجمالي اليوم</span>
      </div>
    </div>
  )
}

/** The day's cardio and diet questions (1-10); read-only in the history view. */
export function DailyRatings({ value, onChange, readOnly = false }: {
  value: DayExtras
  onChange?: (patch: DayExtras) => void
  readOnly?: boolean
}) {
  return (
    <section className="daily">
      {QUESTIONS.map((q) => (
        <div key={q.key} className="daily-q">
          <div className="daily-title">
            <h3>{q.title}</h3>
            <p>{q.ar}</p>
            <b className="daily-val" dir="ltr">{value[q.key] != null ? `${value[q.key]} / 10` : '– / 10'}</b>
          </div>
          <div className={readOnly ? 'rate readonly' : 'rate'} role="radiogroup" aria-label={q.title}>
            {TEN.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value[q.key] === n}
                disabled={readOnly}
                onClick={() => onChange?.({ [q.key]: value[q.key] === n ? null : n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
