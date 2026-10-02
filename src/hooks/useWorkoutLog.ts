import { useCallback, useEffect, useState } from 'react'

export type Failure = 'yes' | 'no' | null

export type ExerciseLog = {
  cur?: string
  done?: string
  fail?: Failure
}

type Log = Record<string, ExerciseLog>

const KEY = 'workout-log-v1'

function read(): Log {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '') || {}
  } catch {
    return {}
  }
}

/** Per-exercise tracking, persisted in this browser's localStorage. */
export function useWorkoutLog() {
  const [log, setLog] = useState<Log>(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(log))
    } catch {
      // storage blocked (private mode etc.) - keep working in memory
    }
  }, [log])

  const update = useCallback((id: string, patch: ExerciseLog) => {
    setLog((l) => ({ ...l, [id]: { ...l[id], ...patch } }))
  }, [])

  // clear today's entries; the weights live on in the sheet as next session's "previous"
  const finish = useCallback((ids: string[]) => {
    setLog((l) => {
      const next = { ...l }
      for (const id of ids) next[id] = { cur: '', done: '', fail: null }
      return next
    })
  }, [])

  return { log, update, finish }
}

export function commitment(entry: ExerciseLog | undefined, target: number): number {
  const done = parseFloat(entry?.done ?? '')
  if (!target || !(done >= 0)) return 0
  return Math.min(100, Math.round((done / target) * 100))
}
