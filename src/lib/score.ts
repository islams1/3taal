import type { Exercise } from '../data/plan'
import type { ExerciseLog } from '../hooks/useWorkoutLog'

/** Lowest rep target, e.g. "8-12 reps" → 8. */
export const minReps = (ex: Pick<Exercise, 'reps'>) => parseInt(ex.reps, 10) || 0

export type ExerciseScore = {
  /** 0-100, the average of the three parts below */
  total: number
  /** sets done / working sets */
  sets: number
  /** reps on the lowest set / bottom of the rep range */
  reps: number
  /** current weight vs last time (no drop = 100) */
  weight: number
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

/**
 * An exercise only reaches 100% when every working set was done, the reps hit
 * the bottom of the range, and the weight didn't drop below last time.
 * Anything not logged counts as 0 for its part.
 */
export function exerciseScore(entry: ExerciseLog | undefined, ex: Pick<Exercise, 'workingSets' | 'reps'>, prevWeight?: number): ExerciseScore {
  const done = parseFloat(entry?.done ?? '')
  const reps = parseFloat(entry?.reps ?? '')
  const cur = parseFloat(entry?.cur ?? '')
  const target = minReps(ex)

  const sets = ex.workingSets && done >= 0 ? clamp(done / ex.workingSets) : 0
  const repsPart = !isNaN(reps) ? (target ? clamp(reps / target) : 1) : 0
  const weight = isNaN(cur) ? 0 : prevWeight == null || prevWeight === 0 ? 1 : clamp(cur / prevWeight)

  const pct = (n: number) => Math.round(n * 100)
  return { total: pct((sets + repsPart + weight) / 3), sets: pct(sets), reps: pct(repsPart), weight: pct(weight) }
}

/** All working sets done - the exercise is finished, whatever its score. */
export const setsComplete = (entry: ExerciseLog | undefined, ex: Pick<Exercise, 'workingSets'>) =>
  !!ex.workingSets && parseFloat(entry?.done ?? '') >= ex.workingSets

/** Training part of a saved session: average exercise score over the day's plan. */
export function sessionTrainingScore(s: { dayNumber: number; rows: { commitment: number }[] }, planSize?: number): number {
  const total = planSize || s.rows.length || 1
  return Math.round(s.rows.reduce((sum, r) => sum + (Number(r.commitment) || 0), 0) / total)
}
