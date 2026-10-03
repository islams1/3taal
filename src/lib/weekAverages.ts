import { DAYS } from '../data/plan'
import { sessionTrainingScore } from './score'
import type { SessionPayload } from './sheetSync'

export type WeekAverages = { training?: number; cardio?: number; diet?: number; workouts: number }

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)
/** 0-10 average → a 1-10 rating (an empty week gives nothing, not 0) */
const toRating = (v?: number) => (v === undefined ? undefined : Math.max(1, Math.min(10, Math.round(v))))

/** What the last 7 days of logged workouts say, as 1-10 ratings for the weekly check-in. */
export function weekAverages(sessions: SessionPayload[], now = Date.now()): WeekAverages {
  const week = sessions.filter((s) => now - new Date(s.date).getTime() <= WEEK_MS)
  const training = avg(week.filter((s) => s.rows.length).map((s) =>
    sessionTrainingScore(s, DAYS.find((d) => d.number === s.dayNumber)?.exercises.length) / 10))
  const cardio = avg(week.flatMap((s) => (s.cardio != null ? [s.cardio] : [])))
  const diet = avg(week.flatMap((s) => (s.diet != null ? [s.diet] : [])))
  return { training: toRating(training), cardio: toRating(cardio), diet: toRating(diet), workouts: week.length }
}
