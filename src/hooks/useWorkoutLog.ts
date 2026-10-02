import { useCallback, useEffect, useState } from 'react'

export type Failure = 'yes' | 'no' | null

export type ExerciseLog = {
  cur?: string
  done?: string
  fail?: Failure
}

/** Per-day answers that are not tied to one exercise (1-10 each). */
export type DayExtras = {
  cardio?: number | null
  diet?: number | null
}

type Log = Record<string, ExerciseLog>
type Extras = Record<string, DayExtras>

const KEY = 'workout-log-v1'
const EXTRAS_KEY = 'workout-extras-v1'

function read<T>(key: string): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') || ({} as T)
  } catch {
    return {} as T
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage blocked (private mode etc.) - keep working in memory
  }
}

/** Per-exercise tracking plus the day's cardio/diet ratings, persisted in this browser. */
export function useWorkoutLog() {
  const [log, setLog] = useState<Log>(() => read<Log>(KEY))
  const [extras, setExtras] = useState<Extras>(() => read<Extras>(EXTRAS_KEY))

  useEffect(() => write(KEY, log), [log])
  useEffect(() => write(EXTRAS_KEY, extras), [extras])

  const update = useCallback((id: string, patch: ExerciseLog) => {
    setLog((l) => ({ ...l, [id]: { ...l[id], ...patch } }))
  }, [])

  const updateExtras = useCallback((dayId: string, patch: DayExtras) => {
    setExtras((x) => ({ ...x, [dayId]: { ...x[dayId], ...patch } }))
  }, [])

  // clear today's entries; the weights live on in the sheet as next session's "previous"
  const finish = useCallback((dayId: string, ids: string[]) => {
    setLog((l) => {
      const next = { ...l }
      for (const id of ids) next[id] = { cur: '', done: '', fail: null }
      return next
    })
    setExtras((x) => ({ ...x, [dayId]: {} }))
  }, [])

  return { log, update, extras, updateExtras, finish }
}

export function commitment(entry: ExerciseLog | undefined, target: number): number {
  const done = parseFloat(entry?.done ?? '')
  if (!target || !(done >= 0)) return 0
  return Math.min(100, Math.round((done / target) * 100))
}

/**
 * The day's overall commitment: training % averaged with cardio and diet
 * (each 1-10 → %). Unanswered ratings are left out rather than counted as 0.
 */
export function overallCommitment(training: number, cardio?: number | null, diet?: number | null): number {
  const parts = [training]
  if (cardio != null) parts.push(cardio * 10)
  if (diet != null) parts.push(diet * 10)
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
}
