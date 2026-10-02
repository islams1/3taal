import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { DAYS, type Day, type Exercise } from '../data/plan'
import { overallCommitment, type ExerciseLog } from '../hooks/useWorkoutLog'
import { assetUrl } from '../lib/assetUrl'
import { cachedHistory, fetchHistory, type SessionPayload, type SheetRow } from '../lib/sheetSync'
import { HEAD } from './DayModal'
import { DailyRatings, ScoreStrip } from './DayExtras'
import { ExerciseCard } from './ExerciseCard'
import { Ring } from './Ring'

const LOCALE = 'en-GB'
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const fmtShort = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })

const toEntry = (r: SheetRow): ExerciseLog => ({
  cur: r.cur === '' ? '' : String(r.cur),
  done: r.done === '' ? '' : String(r.done),
  fail: r.failure === 'Yes' ? 'yes' : r.failure === 'No' ? 'no' : null,
})

/** The plan's exercises for that day, plus any logged exercise the plan no longer has. */
function sessionExercises(s: SessionPayload): { day?: Day; items: { ex: Exercise; row?: SheetRow }[] } {
  const day = DAYS.find((d) => d.number === s.dayNumber)
  const byName = new Map(s.rows.map((r) => [r.exercise, r]))
  const items: { ex: Exercise; row?: SheetRow }[] = (day?.exercises ?? []).map((ex) => ({ ex, row: byName.get(ex.name) }))
  s.rows.forEach((r, i) => {
    if (!day?.exercises.some((e) => e.name === r.exercise)) {
      items.push({
        ex: { id: `${s.id}-x${i}`, name: r.exercise, warmupSets: '', workingSets: Number(r.target) || 0, reps: '', rir: '', rest: '', video: '' },
        row: r,
      })
    }
  })
  return { day, items }
}

/** Training part only: average exercise commitment over the day's plan. */
const trainingScore = (s: SessionPayload) => {
  const total = DAYS.find((d) => d.number === s.dayNumber)?.exercises.length || s.rows.length || 1
  return Math.round(s.rows.reduce((sum, r) => sum + (Number(r.commitment) || 0), 0) / total)
}

/** What the list shows: training, cardio and diet together. */
const dayScore = (s: SessionPayload) => overallCommitment(trainingScore(s), s.cardio, s.diet)

/** Same day done before this one (list is newest first). */
const previousOf = (s: SessionPayload, all: SessionPayload[]) =>
  all.find((x) => x.dayNumber === s.dayNumber && x.date < s.date)

function Diff({ value, unit = '%', compact = false }: { value: number; unit?: string; compact?: boolean }) {
  if (!value) return <b className="diff same">{compact ? '=' : '= same as last time'}</b>
  return <b className={value > 0 ? 'diff up' : 'diff down'}>{value > 0 ? '▲ +' : '▼ '}{value}{unit}</b>
}

/** How this session compares with the last time the same day was done. */
function CompareBar({ s, prev }: { s: SessionPayload; prev?: SessionPayload }) {
  if (!prev) return <p className="compare first">First time this day was logged – nothing to compare with yet.</p>
  const prevRows = new Map(prev.rows.map((r) => [r.exercise, r]))
  let up = 0, down = 0, same = 0
  for (const r of s.rows) {
    const p = prevRows.get(r.exercise)
    if (!p || r.cur === '' || p.cur === '') continue
    const d = Number(r.cur) - Number(p.cur)
    if (d > 0) up++
    else if (d < 0) down++
    else same++
  }
  return (
    <div className="compare">
      <span className="compare-title">vs. last time ({fmtShort(prev.date)})</span>
      <span>Day total <Diff value={dayScore(s) - dayScore(prev)} /></span>
      <span className="compare-weights">
        Weights:
        <b className="diff up">▲ {up} up</b>
        <b className="diff down">▼ {down} down</b>
        <b className="diff same">= {same} same</b>
      </span>
    </div>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  /** coach mode: the only screen, closing it logs out */
  coach?: boolean
}

export function HistoryModal({ open, onClose, coach = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [sessions, setSessions] = useState<SessionPayload[]>(cachedHistory)
  const [state, setState] = useState<'loading' | 'ready' | 'offline' | 'outdated'>('loading')
  const [filter, setFilter] = useState<number | null>(null)
  const [selected, setSelected] = useState<SessionPayload | null>(null)

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) {
      dlg.showModal()
      setSelected(null)
      setSessions(cachedHistory())
      setState('loading')
      fetchHistory().then((list) => {
        if (Array.isArray(list)) setSessions(list)
        setState(Array.isArray(list) ? 'ready' : list === 'outdated' ? 'outdated' : 'offline')
      })
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open])

  // block body: newer browsers return a Promise from scrollTo, which React would treat as a cleanup
  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0)
  }, [selected])

  const shown = useMemo(() => sessions.filter((s) => filter === null || s.dayNumber === filter), [sessions, filter])
  const detail = selected ? sessionExercises(selected) : null
  const photo = detail?.day ? `url(${assetUrl(detail.day.photo)})` : undefined

  return (
    <dialog ref={ref} className={coach ? 'day history coach' : 'day history'} aria-label="Workout history" onClose={onClose}
      onClick={(e) => !coach && e.target === e.currentTarget && ref.current?.close()}>
      <div className="day-box" style={photo ? ({ '--photo': photo } as CSSProperties) : undefined}>
        <header className="day-head">
          {selected ? (
            <>
              <button type="button" className="back" onClick={() => setSelected(null)} aria-label="Back to all sessions">
                <svg viewBox="0 0 10 16" aria-hidden="true"><path d="M8 2L2 8l6 6" /></svg>
              </button>
              <h2>
                <small>DAY {selected.dayNumber}</small>{selected.dayLabel}
                <span className="h-date">{fmtDate(selected.date)} · {fmtTime(selected.date)}</span>
              </h2>
              <div className="day-score">
                <Ring value={dayScore(selected)} big />
                <span className="lbl">Day<br />total</span>
              </div>
            </>
          ) : (
            <h2><small>{coach ? 'Welcome, Coach Shady' : 'HISTORY'}</small>View</h2>
          )}
          {coach ? (
            <button type="button" className="logout" onClick={() => ref.current?.close()}>Log out</button>
          ) : (
            <button type="button" className="x" onClick={() => ref.current?.close()} aria-label="Close">&times;</button>
          )}
        </header>

        <div className="day-body" ref={bodyRef}>
          {selected && detail ? (
            <>
              <CompareBar s={selected} prev={previousOf(selected, sessions)} />
              <ScoreStrip training={trainingScore(selected)} extras={{ cardio: selected.cardio, diet: selected.diet }} />
              <div className="panel">
                <div className="ex-head">
                  {HEAD.map((h, i) => <span key={h} className={i ? 'h' : 'h h-name'}>{h}</span>)}
                </div>
                {detail.items.map(({ ex, row }) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    entry={row ? toEntry(row) : undefined}
                    previous={row && row.prev !== '' ? { weight: Number(row.prev) } : undefined}
                    readOnly
                  />
                ))}
              </div>
              <DailyRatings value={{ cardio: selected.cardio, diet: selected.diet }} readOnly />
            </>
          ) : (
            <>
              <div className="hist-filter" role="tablist" aria-label="Filter by day">
                <button type="button" role="tab" aria-selected={filter === null} onClick={() => setFilter(null)}>All</button>
                {DAYS.map((d) => (
                  <button key={d.id} type="button" role="tab" aria-selected={filter === d.number} onClick={() => setFilter(d.number)}>
                    <small>DAY {d.number}</small>{d.label}
                  </button>
                ))}
              </div>

              {state === 'loading' && !sessions.length && <p className="hist-msg">Loading your workouts…</p>}
              {state === 'offline' && <p className="hist-msg warn">Couldn't reach Google Sheet – showing workouts saved on this device.</p>}
              {state === 'outdated' && (
                <p className="hist-msg warn">
                  The Google Sheet script needs updating to show history (Apps Script → Deploy → Manage deployments → New version).
                  Showing workouts saved on this device.
                </p>
              )}
              {state !== 'loading' && !shown.length && (
                <p className="hist-msg">
                  No finished workouts{filter ? ' for this day' : ''} yet. Press <b>Finish workout</b> after a session and it shows up here.
                </p>
              )}

              <ul className="hist-list">
                {shown.map((s) => {
                  const score = dayScore(s)
                  const prev = previousOf(s, sessions)
                  const total = DAYS.find((d) => d.number === s.dayNumber)?.exercises.length ?? s.rows.length
                  const ups = s.rows.filter((r) => typeof r.change === 'number' && r.change > 0).length
                  const info = [
                    fmtTime(s.date),
                    `${s.rows.length}/${total} exercises`,
                    ups ? `▲ ${ups} heavier` : null,
                    s.cardio != null ? `Cardio ${s.cardio}/10` : null,
                    s.diet != null ? `Diet ${s.diet}/10` : null,
                  ].filter(Boolean)
                  return (
                    <li key={s.id}>
                      <button type="button" className="hist-item" onClick={() => setSelected(s)}>
                        <span className="hist-day"><small>DAY {s.dayNumber}</small>{s.dayLabel}</span>
                        <span className="hist-date">
                          {fmtDate(s.date)}
                          <small>{info.join(' · ')}</small>
                        </span>
                        <span className="hist-score">
                          <Ring value={score} />
                          {prev && <Diff value={score - dayScore(prev)} compact />}
                        </span>
                        <span className="hist-go">View
                          <svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" /></svg>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
