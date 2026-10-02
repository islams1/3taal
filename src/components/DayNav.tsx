import type { CSSProperties } from 'react'
import type { Day } from '../data/plan'

type Props = {
  days: Day[]
  onOpen: (day: Day) => void
  /** the day that comes after the last finished one */
  next?: number
  /** days with entries that haven't been finished yet */
  inProgress: Set<string>
}

export function DayNav({ days, onOpen, next, inProgress }: Props) {
  return (
    <nav className="daynav" aria-label="أيام التمرين">
      {days.map((d, i) => {
        const isNext = d.number === next
        const started = inProgress.has(d.id)
        return (
          <button key={d.id} type="button" onClick={() => onOpen(d)} style={{ '--i': i } as CSSProperties}
            className={isNext ? 'is-next' : undefined}>
            <small>DAY {d.number}</small>
            <span>{d.label}</span>
            {started ? <em className="badge started">لسه مكمّلتهوش</em> : isNext && <em className="badge next">اليوم الجاي</em>}
            <i aria-hidden="true">
              <svg viewBox="0 0 10 16">
                <path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </i>
          </button>
        )
      })}
    </nav>
  )
}
