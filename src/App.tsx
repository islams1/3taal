import { useEffect, useMemo, useState } from 'react'
import { CheckinModal } from './components/CheckinModal'
import { DayModal } from './components/DayModal'
import { DayNav } from './components/DayNav'
import { Hero } from './components/Hero'
import { HistoryModal } from './components/HistoryModal'
import { Login, type Role } from './components/Login'
import { DAYS, type Day } from './data/plan'
import { useWorkoutLog } from './hooks/useWorkoutLog'
import { cachedHistory, cachedLast, checkPin, fetchHistory, fetchLast, flushQueue, setPin, type LastWeights, type SessionPayload } from './lib/sheetSync'

const ROLE_KEY = 'app-user-v1'
const PIN_KEY = 'app-pin-v1'

function readRole(): Role | null {
  try {
    const r = localStorage.getItem(ROLE_KEY)
    if (r !== 'islam' && r !== 'shady') return null
    setPin(localStorage.getItem(PIN_KEY) ?? '') // before any request goes out
    return r
  } catch {
    return null
  }
}

function saveRole(r: Role | null, pin = '') {
  setPin(pin)
  try {
    if (r) {
      localStorage.setItem(ROLE_KEY, r)
      localStorage.setItem(PIN_KEY, pin)
    } else {
      localStorage.removeItem(ROLE_KEY)
      localStorage.removeItem(PIN_KEY)
    }
  } catch {
    // storage blocked - the choice just lasts for this visit
  }
}

export default function App() {
  const [role, setRole] = useState<Role | null>(readRole)
  // bumped every time the landing comes back into view, so the intro animation replays before the buttons
  const [visit, setVisit] = useState(0)
  const replay = () => setVisit((v) => v + 1)
  const [openDay, setOpenDay] = useState<Day | null>(null)
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(role === 'shady')
  const workoutLog = useWorkoutLog()
  const [last, setLast] = useState<LastWeights>(cachedLast)
  const [history, setHistory] = useState<SessionPayload[]>(cachedHistory)
  const refreshLast = () => fetchLast().then((l) => l && setLast(l))
  const refreshHistory = () => fetchHistory().then((h) => Array.isArray(h) && setHistory(h))

  // upload any workouts that were finished while offline
  useEffect(() => {
    const sync = () => flushQueue().then(() => { refreshLast(); refreshHistory() })
    sync()
    addEventListener('online', sync)
    return () => removeEventListener('online', sync)
  }, [])

  // a sign-in whose password doesn't work (passwords added or changed, or a fast entry while the
  // sheet was slow) goes back to the login, which then asks for the password
  useEffect(() => {
    if (!role) return
    let stored = ''
    try { stored = localStorage.getItem(PIN_KEY) ?? '' } catch { /* storage blocked */ }
    checkPin(stored).then((r) => { if (r === null) logout() }, () => { /* offline: keep working from this device */ })
  }, [role]) // eslint-disable-line react-hooks/exhaustive-deps

  // previous weights may have been logged from another device - refresh when a day opens
  useEffect(() => {
    if (openDay) refreshLast()
  }, [openDay])

  // the day after the last finished one is "next"
  const next = history.length ? (history[0].dayNumber % DAYS.length) + 1 : 1
  const inProgress = useMemo(() => {
    const { log, extras } = workoutLog
    const ids = DAYS.filter((d) =>
      d.exercises.some((ex) => { const e = log[ex.id]; return !!(e?.cur || e?.done || e?.fail) })
      || extras[d.id]?.cardio != null || extras[d.id]?.diet != null).map((d) => d.id)
    return new Set(ids)
  }, [workoutLog])

  const pick = (r: Role, pin: string) => {
    saveRole(r, pin)
    setRole(r)
    replay()
    if (r === 'shady') setHistoryOpen(true)
    else { refreshLast(); refreshHistory() }
  }
  const logout = () => {
    saveRole(null)
    setHistoryOpen(false)
    setRole(null)
    replay()
  }

  return (
    <>
      {/* first visit plays the full intro; coming back replays a quick version */}
      <main className={visit ? 'landing quick' : 'landing'} key={visit}>
        <Hero />
        {role === null && <Login onPick={pick} />}

        {role === 'islam' && (
          <>
            <DayNav days={DAYS} onOpen={setOpenDay} next={next} inProgress={inProgress} />
            <div className="landing-actions">
              <button type="button" className="view-btn" onClick={() => setHistoryOpen(true)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8M3 3v5h5M12 7v5l3 3" /></svg>
                View
              </button>
              <button type="button" className="checkin-btn" onClick={() => setCheckinOpen(true)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9" /></svg>
                Weekly check-in
              </button>
            </div>
          </>
        )}

        {role === 'shady' && (
          <div className="landing-actions">
            <button type="button" className="view-btn" onClick={() => setHistoryOpen(true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8M3 3v5h5M12 7v5l3 3" /></svg>
              View
            </button>
          </div>
        )}

        {role && (
          <button type="button" className="switch-user" onClick={logout}>
            Signed in as {role === 'islam' ? 'Islam' : 'Shady'} · <u>Switch user</u>
          </button>
        )}
      </main>

      {role === 'islam' && (
        <>
          <DayModal day={openDay} onClose={() => { setOpenDay(null); replay() }} workoutLog={workoutLog}
            last={last}
            onLastChange={(l) => { setLast(l); setHistory(cachedHistory()) }}
            onSynced={() => { refreshLast(); refreshHistory() }} />
          <CheckinModal open={checkinOpen} onClose={() => { setCheckinOpen(false); replay() }} />
        </>
      )}
      <HistoryModal open={historyOpen} coach={role === 'shady'}
        onClose={() => { setHistoryOpen(false); if (role === 'shady') logout(); else replay() }} />
    </>
  )
}
