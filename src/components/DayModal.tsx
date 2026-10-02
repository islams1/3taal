import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TRAINING_LOG_URL, type Day } from '../data/plan'
import { commitment, overallCommitment, useWorkoutLog } from '../hooks/useWorkoutLog'
import { assetUrl } from '../lib/assetUrl'
import { useConfirm } from './Confirm'
import { DailyRatings, ScoreStrip } from './DayExtras'
import { ExerciseCard } from './ExerciseCard'
import { Ring } from './Ring'
import { buildSession, lastKey, rememberSession, sendSession, type LastWeights, type SyncResult } from '../lib/sheetSync'

const SYNC_TEXT: Record<SyncResult | 'sending', string> = {
  sending: 'بيتحفظ في الشيت…',
  sent: '✓ اتحفظ في الشيت',
  queued: 'مفيش نت – اتحفظ على الموبايل وهيترفع لوحده لما النت يرجع',
  'not-configured': 'اتحفظ على الجهاز ده بس (الشيت مش متوصل)',
  empty: 'مفيش حاجة متسجلة – مفيش حاجة تتحفظ',
}

export const HEAD = ['التمرين', 'إحماء', 'مجاميع', 'عدات', 'RIR', 'راحة', 'فيديو']

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

  const training = day
    ? Math.round(day.exercises.reduce((s, ex) => s + commitment(log[ex.id], ex.workingSets), 0) / day.exercises.length)
    : 0
  const dayExtras = (day && extras[day.id]) || {}
  const missing = [dayExtras.cardio == null && 'الكارديو', dayExtras.diet == null && 'الدايت'].filter(Boolean)

  const onFinish = async () => {
    if (!day) return
    const ok = await confirm({
      title: 'تخلّص التمرين؟',
      message: (missing.length ? `لسه ما قيّمتش التزامك ب${missing.join(' و')}. ` : '')
        + 'أوزان النهارده هتبقى "الوزن السابق" المرة الجاية، والخانات هتتمسح.',
      confirmText: 'خلّص',
    })
    if (!ok) return
    const session = buildSession(day, log, last, dayExtras)
    finish(day.id, day.exercises.map((e) => e.id))
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
      dir="rtl"
      aria-label={day ? `اليوم ${day.number}: ${day.label}` : undefined}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
    >
      {day && (
        <div className="day-box" style={{ '--photo': `url(${assetUrl(day.photo)})` } as CSSProperties}>
          <header className="day-head">
            <h2><small>DAY {day.number}</small>{day.label}</h2>
            <div className="day-score">
              <Ring value={overallCommitment(training, dayExtras.cardio, dayExtras.diet)} big />
              <span className="lbl">إجمالي<br />اليوم</span>
            </div>
            <button type="button" className="x" onClick={() => ref.current?.close()} aria-label="اقفل">&times;</button>
          </header>

          <div className="day-body" ref={bodyRef}>
            <ScoreStrip training={training} extras={dayExtras} />
            <div className="panel">
              <div className="ex-head">
                {HEAD.map((h, i) => <span key={h} className={i ? 'h' : 'h h-name'}>{h}</span>)}
              </div>
              {day.exercises.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} entry={log[ex.id]} previous={last[lastKey(day.number, ex.name)]} onChange={(patch) => update(ex.id, patch)} />
              ))}
            </div>
            <DailyRatings value={dayExtras} onChange={(patch) => updateExtras(day.id, patch)} />
          </div>

          {sync && <p className={`sync sync-${sync}`} role="status">{SYNC_TEXT[sync]}</p>}
          <footer className="day-foot">
            <button type="button" className="finish" onClick={onFinish}>خلّص التمرين</button>
            <a className="logbtn" href={TRAINING_LOG_URL} target="_blank" rel="noopener">سجل التدريب</a>
          </footer>
        </div>
      )}
    </dialog>
  )
}
