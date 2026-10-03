import type { Day } from '../data/plan'
import type { DayExtras, ExerciseLog } from '../hooks/useWorkoutLog'
import { exerciseScore } from './score'

export type SheetRow = {
  exercise: string
  prev: number | ''
  cur: number | ''
  change: number | ''
  done: number | ''
  target: number
  commitment: number
  failure: 'Yes' | 'No' | ''
  /** reps on the lowest set; '' when not logged (and for older rows) */
  reps?: number | ''
}

export type SessionPayload = {
  id: string
  date: string
  dayNumber: number
  dayLabel: string
  rows: SheetRow[]
  /** 1-10 ratings for the day; null/undefined when not answered (and for older sessions) */
  cardio?: number | null
  diet?: number | null
}

/** True when the session holds anything worth saving. */
export const hasContent = (s: SessionPayload) => s.rows.length > 0 || s.cardio != null || s.diet != null

export type SyncResult = 'sent' | 'queued' | 'not-configured' | 'empty' | 'unauthorized'

/** Latest logged weight per exercise, keyed by lastKey(). */
export type LastWeights = Record<string, { weight: number; date: string }>

const SHEET_URL = import.meta.env.VITE_SHEET_URL as string | undefined
const QUEUE_KEY = 'workout-sync-queue-v1'
const LAST_KEY = 'workout-last-v1'

export const sheetConfigured = !!SHEET_URL
export const lastKey = (dayNumber: number, exercise: string) => `${dayNumber}|${exercise}`

const num = (v?: string): number | '' => {
  const n = parseFloat(v ?? '')
  return isNaN(n) ? '' : n
}

// ---- password: sent with every request, checked by the Apps Script ----

let pin = ''
export const setPin = (value: string) => { pin = value }

function sheetUrl(view?: string, withPin = pin) {
  const u = new URL(SHEET_URL!)
  if (view) u.searchParams.set('view', view)
  if (withPin) u.searchParams.set('pin', withPin)
  return u.toString()
}

async function getJson(view?: string) {
  const body = await (await fetch(sheetUrl(view))).json()
  if (body.error === 'unauthorized') throw new Error('unauthorized')
  return body
}

/** 'trainee' | 'coach' | 'open' for a valid password, null for a wrong one; throws when offline. */
export async function checkPin(candidate: string): Promise<'trainee' | 'coach' | 'open' | null> {
  if (!SHEET_URL) return 'open'
  const body = await (await fetch(sheetUrl('auth', candidate))).json()
  if (body.ok === true && body.role) return body.role
  if (body.error === 'unauthorized') return null
  // an Apps Script from before passwords: no auth endpoint, so it is open
  return body.ok === true ? 'open' : null
}

// ---- workouts ----

/** One row per exercise the trainee actually filled in. */
export function buildSession(day: Day, log: Record<string, ExerciseLog>, last: LastWeights, extras: DayExtras = {}): SessionPayload {
  const rows = day.exercises.flatMap((ex): SheetRow[] => {
    const e = log[ex.id]
    if (!e || (!e.cur && !e.done && !e.fail && !e.reps)) return []
    const found: LastWeights[string] | undefined = last[lastKey(day.number, ex.name)]
    const prev: number | '' = found ? found.weight : '', cur = num(e.cur)
    return [{
      exercise: ex.name,
      prev,
      cur,
      change: prev !== '' && cur !== '' ? +(cur - prev).toFixed(2) : '',
      done: num(e.done),
      target: ex.workingSets,
      commitment: exerciseScore(e, ex, found?.weight).total,
      failure: e.fail === 'yes' ? 'Yes' : e.fail === 'no' ? 'No' : '',
      reps: num(e.reps),
    }]
  })
  return {
    id: crypto.randomUUID(), date: new Date().toISOString(), dayNumber: day.number, dayLabel: day.label, rows,
    cardio: extras.cardio ?? null, diet: extras.diet ?? null,
  }
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

async function post(session: SessionPayload): Promise<boolean | 'unauthorized'> {
  try {
    // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
    const res = await fetch(SHEET_URL!, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...session, pin }) })
    const body = await res.json()
    if (body.error === 'unauthorized') return 'unauthorized'
    return body.ok === true
  } catch {
    return false
  }
}

let running: Promise<number> | null = null
let lastUnauthorized = false

/** Retry anything that failed earlier (offline gym, bad signal...). Runs one at a time. */
export function flushQueue(): Promise<number> {
  if (!SHEET_URL) return Promise.resolve(0)
  const run = async () => {
    const sent = new Set<string>()
    lastUnauthorized = false
    for (const s of readQueue()) {
      const r = await post(s)
      if (r === true) sent.add(s.id)
      else if (r === 'unauthorized') lastUnauthorized = true
    }
    // re-read: a session may have been queued while we were uploading
    const left = readQueue().filter((s) => !sent.has(s.id))
    writeQueue(left)
    return left.length
  }
  running = (running ?? Promise.resolve(0)).then(run, run)
  return running
}

export async function sendSession(session: SessionPayload): Promise<SyncResult> {
  if (!hasContent(session)) return 'empty'
  if (!SHEET_URL) return 'not-configured'
  writeQueue([...readQueue(), session])
  const left = await flushQueue()
  if (left === 0) return 'sent'
  return lastUnauthorized ? 'unauthorized' : 'queued'
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

/** Apply sessions that haven't reached the sheet yet on top of what the sheet says. */
function withQueuedWeights(base: LastWeights): LastWeights {
  const merged = { ...base }
  for (const s of readQueue()) {
    for (const r of s.rows) {
      const k = lastKey(s.dayNumber, r.exercise)
      if (r.cur !== '' && (!merged[k] || s.date > merged[k].date)) merged[k] = { weight: r.cur, date: s.date }
    }
  }
  return merged
}

/**
 * The sheet is the source of truth (rows deleted there disappear here too);
 * only workouts still waiting to upload are layered on top. null when unreachable.
 */
export async function fetchLast(): Promise<LastWeights | null> {
  if (!SHEET_URL) return null
  try {
    const body = await getJson()
    if (body.ok !== true || typeof body.last !== 'object') return null
    const merged = withQueuedWeights(body.last)
    saveLast(merged)
    if ('lastCheckin' in body) saveLastCheckin(body.lastCheckin ?? null)
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
export type CheckinResult = 'sent' | 'failed' | 'not-configured' | 'unauthorized'
export type CheckinSendResult = { result: CheckinResult; photosFolder?: string }
export type LastCheckin = { weight: number; date: string } | null

/** A saved check-in as the sheet returns it. */
export type CheckinRecord = {
  date: string
  weight: number | ''
  prevWeight: number | ''
  change: number | ''
  training: number | ''
  diet: number | ''
  cardio: number | ''
  lowSleep: string
  soreness: string
  progress: string
  problems: string
  harderDiet: string
  uncomfortable: string
  support: string
  photos: { url: string; id: string }[]
}

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
    const body = await getJson()
    if (body.ok === true) saveLastCheckin(body.lastCheckin ?? null)
  } catch {
    // offline - use the cached value
  }
  return cachedLastCheckin()
}

/** Every check-in in the sheet; 'outdated' when the Apps Script predates this endpoint. */
export async function fetchCheckins(): Promise<CheckinRecord[] | 'outdated' | null> {
  if (!SHEET_URL) return null
  try {
    const body = await getJson('checkins')
    if (body.ok === true && !Array.isArray(body.checkins)) return 'outdated'
    return body.ok === true ? body.checkins : null
  } catch {
    return null
  }
}

/** Check-ins carry photos, so they are sent straight away rather than queued in storage. */
export async function sendCheckin(answers: object, photos: CheckinPhoto[], weight: number | ''): Promise<CheckinSendResult> {
  const date = new Date().toISOString()
  if (!SHEET_URL) {
    if (weight !== '') saveLastCheckin({ weight, date })
    return { result: 'not-configured' }
  }
  try {
    const res = await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'checkin', date, answers, photos, pin }),
    })
    const body = await res.json()
    if (body.error === 'unauthorized') return { result: 'unauthorized' }
    if (body.ok !== true) return { result: 'failed' }
    if (weight !== '') saveLastCheckin({ weight, date })
    return { result: 'sent', photosFolder: body.photosFolder || undefined }
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

/**
 * The sheet's history plus workouts still waiting to upload from this device.
 * Anything removed from the sheet is dropped from the local copy too.
 * 'outdated' = the sheet answered but its Apps Script predates the history endpoint.
 */
export async function fetchHistory(): Promise<SessionPayload[] | 'outdated' | null> {
  if (!SHEET_URL) return null
  try {
    const body = await getJson('history')
    if (body.ok === true && !Array.isArray(body.sessions)) return 'outdated'
    if (body.ok !== true) return null
    const remote = body.sessions as SessionPayload[]
    const ids = new Set(remote.map((s) => s.id))
    const merged = newestFirst([...remote, ...readQueue().filter((s) => !ids.has(s.id))])
    saveHistory(merged)
    return merged
  } catch {
    return null
  }
}

function addToHistory(session: SessionPayload) {
  if (hasContent(session)) saveHistory(newestFirst([session, ...cachedHistory().filter((s) => s.id !== session.id)]))
}
