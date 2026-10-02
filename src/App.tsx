import { useEffect, useState } from 'react'
import { CheckinModal } from './components/CheckinModal'
import { DayModal } from './components/DayModal'
import { DayNav } from './components/DayNav'
import { Hero } from './components/Hero'
import { HistoryModal } from './components/HistoryModal'
import { DAYS, type Day } from './data/plan'
import { useWorkoutLog } from './hooks/useWorkoutLog'
import { cachedLast, fetchLast, flushQueue, type LastWeights } from './lib/sheetSync'

export default function App() {
  const [openDay, setOpenDay] = useState<Day | null>(null)
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const workoutLog = useWorkoutLog()
  const [last, setLast] = useState<LastWeights>(cachedLast)
  const refreshLast = () => fetchLast().then((l) => l && setLast(l))

  // upload any workouts that were finished while offline
  useEffect(() => {
    const sync = () => flushQueue().then(refreshLast)
    sync()
    addEventListener('online', sync)
    return () => removeEventListener('online', sync)
  }, [])

  // previous weights may have been logged from another device - refresh when a day opens
  useEffect(() => {
    if (openDay) refreshLast()
  }, [openDay])

  return (
    <>
      <main className="landing">
        <Hero />
        <DayNav days={DAYS} onOpen={setOpenDay} />
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
      </main>
      <DayModal day={openDay} onClose={() => setOpenDay(null)} workoutLog={workoutLog}
        last={last} onLastChange={setLast} onSynced={refreshLast} />
      <CheckinModal open={checkinOpen} onClose={() => setCheckinOpen(false)} />
      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}
