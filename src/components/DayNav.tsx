import type { CSSProperties } from 'react'
import type { Day } from '../data/plan'

type Props = { days: Day[]; onOpen: (day: Day) => void }

export function DayNav({ days, onOpen }: Props) {
  return (
    <nav className="daynav" aria-label="Workout days">
      {days.map((d, i) => (
        <button key={d.id} type="button" onClick={() => onOpen(d)} style={{ '--i': i } as CSSProperties}>
          <small>DAY {d.number}</small>
          <span>{d.label}</span>
          <i aria-hidden="true">
            <svg viewBox="0 0 10 16">
              <path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </i>
        </button>
      ))}
    </nav>
  )
}
