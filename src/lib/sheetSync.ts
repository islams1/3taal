import type { Day } from '../data/plan'
import { commitment, type ExerciseLog } from '../hooks/useWorkoutLog'

export type SheetRow = {
  exercise: string
  prev: number | ''
  cur: number | ''
  change: number | ''
  done: number | ''
  target: number
  commitment: number
  failure: 'Yes' | 'No' | ''
}

export type SessionPayload = {
  id: string
  date: string
  dayNumber: number
  dayLabel: string
  rows: SheetRow[]
}

export type SyncResult = 'sent' | 'queued' | 'not-configured' | 'empty'

/** Latest logged weight per exercise, keyed by lastKey(). */
export type LastWeights = Record<string, { weight: number; date: string }>

const SHEET_URL = import.meta.env.VITE_SHEET_URL as string | undefined
const QUEUE_KEY = 'workout-sync-queue-v1'
const LAST_KEY = 'workout-last-v1'

export const lastKey = (dayNumber: number, exercise: string) => `${dayNumber}|${exercise}`

const num = (v?: string): number | '' => {
  const n = parseFloat(v ?? '')
  return isNaN(n) ? '' : n
}

/** One row per exercise the trainee actually filled in. */
export function buildSession(day: Day, log: Record<string, ExerciseLog>, last: LastWeights): SessionPayload {
  const rows = day.exercises.flatMap((ex): SheetRow[] => {
    const e = log[ex.id]
    if (!e || (!e.cur && !e.done && !e.fail)) return []
    const found: LastWeights[string] | undefined = last[lastKey(day.number, ex.name)]
    const prev: number | '' = found ? found.weight : '', cur = num(e.cur)
    return [{
      exercise: ex.name,
      prev,
      cur,
      change: prev !== '' && cur !== '' ? +(cur - prev).toFixed(2) : '',
      done: num(e.done),
      target: ex.workingSets,
      commitment: commitment(e, ex.workingSets),
      failure: e.fail === 'yes' ? 'Yes' : e.fail === 'no' ? 'No' : '',
    }]
  })
  return { id: crypto.randomUUID(), date: new Date().toISOString(), dayNumber: day.number, dayLabel: day.label, rows }
}

function readQueue(): SessionPayload[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeQueue(q: SessionPayload[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
  } catch {
    // storage blocked - nothing more we can do
  }
}

async function post(session: SessionPayload): Promise<boolean> {
  try {
    // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
    const res = await fetch(SHEET_URL!, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(session) })
    const body = await res.json()
    return body.ok === true
  } catch {
    return false
  }
}

let running: Promise<number> | null = null

/** Retry anything that failed earlier (offline gym, bad signal...). Runs one at a time. */
export function flushQueue(): Promise<number> {
  if (!SHEET_URL) return Promise.resolve(0)
  const run = async () => {
    const sent = new Set<string>()
    for (const s of readQueue()) if (await post(s)) sent.add(s.id)
    // re-read: a session may have been queued while we were uploading
    const left = readQueue().filter((s) => !sent.has(s.id))
    writeQueue(left)
    return left.length
  }
  running = (running ?? Promise.resolve(0)).then(run, run)
  return running
}

export async function sendSession(session: SessionPayload): Promise<SyncResult> {
  if (!session.rows.length) return 'empty'
  if (!SHEET_URL) return 'not-configured'
  writeQueue([...readQueue(), session])
  return (await flushQueue()) === 0 ? 'sent' : 'queued'
}

// ---- previous weights: read back from the sheet, cached for offline use ----

export function cachedLast(): LastWeights {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveLast(last: LastWeights) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(last))
  } catch {
    // storage blocked - the in-memory copy still works for this visit
  }
}

/** The sheet is the source of truth; null when it can't be reached. */
export async function fetchLast(): Promise<LastWeights | null> {
  if (!SHEET_URL) return null
  try {
    const body = await (await fetch(SHEET_URL)).json()
    if (body.ok !== true || typeof body.last !== 'object') return null
    // keep newer local entries that may still be waiting in the upload queue
    const merged: LastWeights = { ...body.last }
    for (const [k, v] of Object.entries(cachedLast())) if (!merged[k] || v.date > merged[k].date) merged[k] = v
    saveLast(merged)
    return merged
  } catch {
    return null
  }
}

/** Today's current weights become next session's previous weights right away. */
export function rememberSession(session: SessionPayload): LastWeights {
  const last = cachedLast()
  for (const r of session.rows) if (r.cur !== '') last[lastKey(session.dayNumber, r.exercise)] = { weight: r.cur, date: session.date }
  saveLast(last)
  addToHistory(session)
  return last
}

// ---- weekly check-in ----

export type CheckinPhoto = { type: string; data: string } // base64, no data: prefix
export type CheckinResult = 'sent' | 'failed' | 'not-configured'
export type CheckinSendResult = { result: CheckinResult; photosFolder?: string }
export type LastCheckin = { weight: number; date: string } | null

const CHECKIN_LAST_KEY = 'checkin-last-v1'

export function cachedLastCheckin(): LastCheckin {
  try {
    return JSON.parse(localStorage.getItem(CHECKIN_LAST_KEY) ?? 'null')
  } catch {
    return null
  }
}

function saveLastCheckin(v: LastCheckin) {
  try {
    localStorage.setItem(CHECKIN_LAST_KEY, JSON.stringify(v))
  } catch {
    // ignore
  }
}

/** Latest check-in weight from the sheet, falling back to this device's copy. */
export async function fetchLastCheckin(): Promise<LastCheckin> {
  if (!SHEET_URL) return cachedLastCheckin()
  try {
    const body = await (await fetch(SHEET_URL)).json()
    if (body.ok === true && body.lastCheckin) saveLastCheckin(body.lastCheckin)
  } catch {
    // offline - use the cached value
  }
  return cachedLastCheckin()
}

/** Check-ins carry photos, so they are sent straight away rather than queued in storage. */
export async function sendCheckin(answers: object, photos: CheckinPhoto[], weight: number | ''): Promise<CheckinSendResult> {
  const date = new Date().toISOString()
  if (weight !== '') saveLastCheckin({ weight, date })
  if (!SHEET_URL) return { result: 'not-configured' }
  try {
    const res = await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'checkin', date, answers, photos }),
    })
    const body = await res.json()
    return body.ok === true ? { result: 'sent', photosFolder: body.photosFolder || undefined } : { result: 'failed' }
  } catch {
    return { result: 'failed' }
  }
}

// ---- history: every finished workout, for the "View" screen ----

const HISTORY_KEY = 'workout-history-v1'

export function cachedHistory(): SessionPayload[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveHistory(list: SessionPayload[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    // storage full or blocked - the sheet still has everything
  }
}

const newestFirst = (list: SessionPayload[]) => [...list].sort((a, b) => (a.date < b.date ? 1 : -1))

/** Sheet history merged with sessions finished on this device that may not have uploaded yet. */
export async function fetchHistory(): Promise<SessionPayload[] | null> {
  if (!SHEET_URL) return null
  try {
    const body = await (await fetch(`${SHEET_URL}?view=history`)).json()
    if (body.ok !== true || !Array.isArray(body.sessions)) return null
    const byId = new Map<string, SessionPayload>()
    for (const s of cachedHistory()) byId.set(s.id, s)
    for (const s of body.sessions as SessionPayload[]) byId.set(s.id, s)
    const merged = newestFirst([...byId.values()])
    saveHistory(merged)
    return merged
  } catch {
    return null
  }
}

function addToHistory(session: SessionPayload) {
  if (session.rows.length) saveHistory(newestFirst([session, ...cachedHistory().filter((s) => s.id !== session.id)]))
}
