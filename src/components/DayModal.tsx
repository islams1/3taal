import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Day } from '../data/plan'
import { overallCommitment, useWorkoutLog } from '../hooks/useWorkoutLog'
import { assetUrl } from '../lib/assetUrl'
import { exerciseScore, setsComplete } from '../lib/score'
import { buildSession, lastKey, rememberSession, sendSession, type LastWeights, type SyncResult } from '../lib/sheetSync'
import { useConfirm } from './Confirm'
import { DailyRatings, ScoreStrip } from './DayExtras'
import { ExerciseCard } from './ExerciseCard'
import { Ring } from './Ring'

const SYNC_TEXT: Record<SyncResult | 'sending', string> = {
  sending: 'Saving to Google Sheet…',
  sent: '✓ Saved to Google Sheet',
  queued: 'No connection – saved on this device, will upload automatically',
  'not-configured': 'Saved on this device only (Google Sheet not connected)',
  empty: 'Nothing filled in – nothing to save',
  unauthorized: 'Password changed – switch user and sign in again. Saved on this device for now.',
}

export const HEAD = ['Workout name', 'W.U sets', 'Working sets', 'Reps', 'RIR', 'Rest', 'Video']

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
  const { log, update, extras, updateExtras, finish } = workoutLog
  const [sync, setSync] = useState<SyncResult | 'sending' | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const confirm = useConfirm()

  const prevOf = (name: string) => (day ? last[lastKey(day.number, name)] : undefined)
  // the exercise to work on: the first one whose sets aren't all done
  const firstOpen = (after = -1) =>
    day?.exercises.find((ex, i) => i > after && !setsComplete(log[ex.id], ex))?.id
    ?? day?.exercises.find((ex) => !setsComplete(log[ex.id], ex))?.id
    ?? null

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (day && !dlg.open) {
      dlg.showModal()
      setSync(null)
      setActive(firstOpen())
      bodyRef.current?.scrollTo(0, 0)
    } else if (!day && dlg.open) {
      dlg.close()
    }
  }, [day]) // eslint-disable-line react-hooks/exhaustive-deps

  // when the open exercise's last set is logged, fold it and move on to the next one
  const activeDone = !!(day && active && setsComplete(log[active], day.exercises.find((e) => e.id === active)!))
  useEffect(() => {
    if (!day || !active || !activeDone) return
    const idx = day.exercises.findIndex((e) => e.id === active)
    const t = setTimeout(() => {
      const next = firstOpen(idx)
      setActive(next)
      if (next) setTimeout(() => document.getElementById(`ex-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    }, 900) // let the ring finish filling first
    return () => clearTimeout(t)
  }, [activeDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => {
    setActive((cur) => (cur === id ? null : id))
    setTimeout(() => document.getElementById(`ex-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
  }

  const training = day
    ? Math.round(day.exercises.reduce((s, ex) => s + exerciseScore(log[ex.id], ex, prevOf(ex.name)?.weight).total, 0) / day.exercises.length)
    : 0
  const dayExtras = (day && extras[day.id]) || {}
  const missing = [dayExtras.cardio == null && 'cardio', dayExtras.diet == null && 'diet'].filter(Boolean)

  const onFinish = async () => {
    if (!day) return
    const ok = await confirm({
      title: 'Finish this workout?',
      message: (missing.length ? `You haven't rated your ${missing.join(' and ')} commitment yet. ` : '')
        + 'Today\'s weights become next time\'s "Previous weight" and the fields reset.',
      confirmText: 'Finish',
    })
    if (!ok) return
    const session = buildSession(day, log, last, dayExtras)
    finish(day.id, day.exercises.map((e) => e.id))
    onLastChange(rememberSession(session))
    setActive(day.exercises[0]?.id ?? null)
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
        <div className="day-box" style={{ '--photo': `url(${assetUrl(day.photo)})` } as CSSProperties}>
          <header className="day-head">
            <h2><small>DAY {day.number}</small>{day.label}</h2>
            <div className="day-score">
              <Ring value={overallCommitment(training, dayExtras.cardio, dayExtras.diet)} big />
              <span className="lbl">Day<br />total</span>
            </div>
            <button type="button" className="x" onClick={() => ref.current?.close()} aria-label="Close">&times;</button>
          </header>

          <div className="day-body" ref={bodyRef}>
            <ScoreStrip training={training} extras={dayExtras} />
            <div className="panel">
              <div className="ex-head">
                {HEAD.map((h, i) => <span key={h} className={i ? 'h' : 'h h-name'}>{h}</span>)}
              </div>
              {day.exercises.map((ex) => (
                <div key={ex.id} id={`ex-${ex.id}`} className="ex-slot">
                  <ExerciseCard exercise={ex} entry={log[ex.id]} previous={prevOf(ex.name)}
                    open={active === ex.id} onToggle={() => toggle(ex.id)} onChange={(patch) => update(ex.id, patch)} />
                </div>
              ))}
            </div>
            <DailyRatings value={dayExtras} onChange={(patch) => updateExtras(day.id, patch)} />
          </div>

          {sync && <p className={`sync sync-${sync}`} role="status">{SYNC_TEXT[sync]}</p>}
          <footer className="day-foot">
            <button type="button" className="finish" onClick={onFinish}>Finish workout</button>
          </footer>
        </div>
      )}
    </dialog>
  )
}
