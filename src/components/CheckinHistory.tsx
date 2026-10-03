import { useState } from 'react'
import { QUESTIONS } from '../data/checkin'
import type { CheckinRecord } from '../lib/sheetSync'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function WeightChange({ change }: { change: number | '' }) {
  if (change === '') return <b className="diff same">–</b>
  if (change === 0) return <b className="diff same">= no change</b>
  return <b className={change > 0 ? 'diff up' : 'diff down'}>{change > 0 ? `▲ +${change}` : `▼ ${change}`} kg</b>
}

/** A Drive photo: thumbnail when the viewer's Google account can open it, otherwise a link. */
function Photo({ id, url, n }: { id: string; url: string; n: number }) {
  const [failed, setFailed] = useState(!id)
  return (
    <a className="ck-photo" href={url} target="_blank" rel="noopener" aria-label={`Open photo ${n}`}>
      {failed ? <span>Photo {n}<small>Open in Drive</small></span> : (
        <img src={`https://drive.google.com/thumbnail?id=${id}&sz=w600`} alt={`Check-in photo ${n}`} loading="lazy"
          referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      )}
    </a>
  )
}

/** One check-in, laid out like the form it came from. */
export function CheckinDetail({ c }: { c: CheckinRecord }) {
  return (
    <div className="ck-view">
      <section className="ck-weight-card">
        <div><span className="lbl">Current weight</span><b>{c.weight === '' ? '–' : `${c.weight} kg`}</b></div>
        <div><span className="lbl">Previous weight</span><b>{c.prevWeight === '' ? '–' : `${c.prevWeight} kg`}</b></div>
        <div><span className="lbl">Change</span><WeightChange change={c.change} /></div>
      </section>
      {QUESTIONS.map((q) => {
        const v = c[q.key as keyof CheckinRecord] as string | number
        const empty = v === '' || v === null || v === undefined
        return (
          <section key={q.n} className="ck-answer">
            <h4><span className="q-n">{q.n}</span>{q.text}</h4>
            {q.kind === 'rating' ? (
              <p className="ck-rating">
                <span className="ck-bar"><i style={{ width: `${(Number(v) || 0) * 10}%` }} /></span>
                <b>{empty ? '–' : v} / 10</b>
              </p>
            ) : (
              <p className={empty ? 'ck-text empty' : 'ck-text'}>{empty ? 'No answer' : String(v)}</p>
            )}
          </section>
        )
      })}
      <section className="ck-answer">
        <h4><span className="q-n">11</span>Photos on an empty stomach</h4>
        {c.photos.length ? (
          <div className="ck-photo-grid">
            {c.photos.map((p, i) => <Photo key={p.url} id={p.id} url={p.url} n={i + 1} />)}
          </div>
        ) : <p className="ck-text empty">No photos</p>}
      </section>
    </div>
  )
}

/** Newest first; each row shows the weight change and the three ratings. */
export function CheckinList({ items, onOpen }: { items: CheckinRecord[]; onOpen: (c: CheckinRecord) => void }) {
  return (
    <ul className="hist-list">
      {items.map((c) => (
        <li key={c.date}>
          <button type="button" className="hist-item ck-item" onClick={() => onOpen(c)}>
            <span className="hist-day"><small>WEEKLY</small>check-in</span>
            <span className="hist-date">
              {fmtDate(c.date)}
              <small>
                {[`Training ${c.training || '–'}/10`, `Diet ${c.diet || '–'}/10`, `Cardio ${c.cardio || '–'}/10`,
                  c.photos.length ? `${c.photos.length} photo${c.photos.length === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ')}
              </small>
            </span>
            <span className="hist-score ck-weight">
              <b>{c.weight === '' ? '–' : `${c.weight} kg`}</b>
              <WeightChange change={c.change} />
            </span>
            <span className="hist-go">View
              <svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" /></svg>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
