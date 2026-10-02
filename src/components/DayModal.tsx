import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TRAINING_LOG_URL, type Day } from '../data/plan'
import { commitment, useWorkoutLog } from '../hooks/useWorkoutLog'
import { useConfirm } from './Confirm'
import { ExerciseCard } from './ExerciseCard'
import { Ring } from './Ring'
import { buildSession, lastKey, rememberSession, sendSession, type LastWeights, type SyncResult } from '../lib/sheetSync'

const SYNC_TEXT: Record<SyncResult | 'sending', string> = {
  sending: 'Saving to Google Sheet…',
  sent: '✓ Saved to Google Sheet',
  queued: 'No connection – saved here, will upload automatically',
  'not-configured': 'Saved on this device (Google Sheet not connected yet)',
  empty: 'Nothing filled in – nothing to save',
}

const HEAD = ['Workout<br>Name', 'W.U<br>Sets', 'Working<br>Sets', 'Reps', 'RIR', 'Rest', 'Workout<br>Video']

type Props = {
  day: Day | null
  onClose: () => void
  workoutLog: ReturnType<typeof useWorkoutLog>
  last: LastWeights
  onLastChange: (last: LastWeights) => void
  onSynced: () => void
}

export function DayModal({ day, onClose, workoutLog, last, onLastChange, onSynced }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const { log, update, finish } = workoutLog
  const [sync, setSync] = useState<SyncResult | 'sending' | null>(null)
  const confirm = useConfirm()

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (day && !dlg.open) {
      dlg.showModal()
      setSync(null)
      bodyRef.current?.scrollTo(0, 0)
    } else if (!day && dlg.open) {
      dlg.close()
    }
  }, [day])

  const dayScore = day
    ? Math.round(day.exercises.reduce((s, ex) => s + commitment(log[ex.id], ex.workingSets), 0) / day.exercises.length)
    : 0

  const onFinish = async () => {
    if (!day) return
    const ok = await confirm({
      title: 'Finish this workout?',
      message: "Today's weights become next time's \"Previous weight\" and the fields reset.",
      confirmText: 'Finish',
    })
    if (!ok) return
    const session = buildSession(day, log, last)
    finish(day.exercises.map((e) => e.id))
    onLastChange(rememberSession(session))
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setSync('sending')
    const result = await sendSession(session)
    setSync(result)
    if (result === 'sent') onSynced()
  }

  return (
    <dialog
      ref={ref}
      className="day"
      aria-label={day ? `Day ${day.number}: ${day.label}` : undefined}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
    >
      {day && (
        <div className="day-box" style={{ '--photo': `url(${import.meta.env.BASE_URL}${day.photo})` } as CSSProperties}>
          <header className="day-head">
            <h2><small>DAY {day.number}</small>{day.label}</h2>
            <div className="day-score">
              <Ring value={dayScore} big />
              <span className="lbl">Day<br />commitment</span>
            </div>
            <button type="button" className="x" onClick={() => ref.current?.close()} aria-label="Close">&times;</button>
          </header>

          <div className="day-body" ref={bodyRef}>
            <div className="panel">
              <div className="ex-head">
                {HEAD.map((h, i) => <span key={h} className={i ? "h" : "h h-name"} dangerouslySetInnerHTML={{ __html: h }} />)}
              </div>
              {day.exercises.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} entry={log[ex.id]} previous={last[lastKey(day.number, ex.name)]} onChange={(patch) => update(ex.id, patch)} />
              ))}
            </div>
          </div>

          {sync && <p className={`sync sync-${sync}`} role="status">{SYNC_TEXT[sync]}</p>}
          <footer className="day-foot">
            <button type="button" className="finish" onClick={onFinish}>Finish workout</button>
            <a className="logbtn" href={TRAINING_LOG_URL} target="_blank" rel="noopener">TRAINING LOG</a>
          </footer>
        </div>
      )}
    </dialog>
  )
}
