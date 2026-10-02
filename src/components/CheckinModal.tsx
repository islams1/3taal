import { useEffect, useRef, useState } from 'react'
import { EMPTY_ANSWERS, MAX_PHOTOS, QUESTIONS, REQUIRED, type CheckinAnswers, type Question } from '../data/checkin'
import { compressImage } from '../lib/compressImage'
import { fetchLastCheckin, sendCheckin, type CheckinResult } from '../lib/sheetSync'
import { checkinMessage, whatsappLink } from '../lib/whatsapp'

const DRAFT_KEY = 'checkin-draft-v1'
const TEN = Array.from({ length: 10 }, (_, i) => i + 1)

type Photo = { id: string; type: string; data: string; preview: string }
type Status = 'idle' | 'sending' | CheckinResult

function readDraft(): CheckinAnswers {
  try {
    return { ...EMPTY_ANSWERS, ...JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') }
  } catch {
    return EMPTY_ANSWERS
  }
}

export function CheckinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [a, setA] = useState<CheckinAnswers>(readDraft)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [missing, setMissing] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<Status>('idle')
  const [busyPhotos, setBusyPhotos] = useState(false)
  const [waLink, setWaLink] = useState('')

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) {
      dlg.showModal()
      if (status !== 'sending') setStatus('idle')
      bodyRef.current?.scrollTo(0, 0)
      // previous weight = the weight from the last check-in
      fetchLastCheckin().then((last) => {
        if (last) setA((cur) => (cur.prevWeight ? cur : { ...cur, prevWeight: String(last.weight) }))
      })
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // keep typed answers if the trainee closes the form half way
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(a))
    } catch {
      // storage blocked
    }
  }, [a])

  const set = <K extends keyof CheckinAnswers>(key: K, value: CheckinAnswers[K]) => {
    setA((cur) => ({ ...cur, [key]: value }))
    setMissing((m) => {
      if (!m.has(key)) return m
      const next = new Set(m)
      next.delete(key)
      return next
    })
  }

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    setBusyPhotos(true)
    const room = MAX_PHOTOS - photos.length
    const picked = [...files].filter((f) => f.type.startsWith('image/')).slice(0, room)
    const done = await Promise.all(picked.map(async (f) => ({ id: crypto.randomUUID(), ...(await compressImage(f)) })))
    setPhotos((p) => [...p, ...done].slice(0, MAX_PHOTOS))
    setBusyPhotos(false)
  }

  const submit = async () => {
    const miss = new Set<string>(REQUIRED.filter((k) => a[k] === null || a[k] === ''))
    setMissing(miss)
    if (miss.size) {
      bodyRef.current?.querySelector(`[data-key="${[...miss][0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setStatus('sending')
    const weight = parseFloat(a.weight)
    const { result, photosFolder } = await sendCheckin(a, photos.map(({ type, data }) => ({ type, data })), isNaN(weight) ? '' : weight)
    setStatus(result)
    if (result !== 'failed') {
      // build the WhatsApp summary before the form is cleared
      setWaLink(whatsappLink(checkinMessage(a, photos.length, photosFolder)))
      setA({ ...EMPTY_ANSWERS, prevWeight: a.weight })
      setPhotos([])
      bodyRef.current?.scrollTo(0, 0)
    }
  }

  const change = (() => {
    const c = parseFloat(a.weight), p = parseFloat(a.prevWeight)
    if (isNaN(c) || isNaN(p) || c === p) return null
    const d = +(c - p).toFixed(2)
    return <b className={d > 0 ? 'delta up' : 'delta down'}>{d > 0 ? `▲ +${d}` : `▼ ${d}`}</b>
  })()

  const field = (q: Question) => {
    const bad = missing.has(q.key)
    return (
      <fieldset key={q.n} className={bad ? 'q missing' : 'q'} data-key={q.key}>
        <legend><span className="q-n">{q.n}</span>{q.text}</legend>
        {q.kind === 'rating' && (
          <div className="rate" role="radiogroup" aria-label={q.text}>
            {TEN.map((v) => (
              <button key={v} type="button" role="radio" aria-checked={a[q.key] === v}
                onClick={() => set(q.key, v as never)}>{v}</button>
            ))}
          </div>
        )}
        {q.kind === 'yesno' && (
          <div className="yn" role="radiogroup" aria-label={q.text}>
            <button type="button" data-v="yes" aria-pressed={a[q.key] === 'نعم'} onClick={() => set(q.key, 'نعم' as never)}>نعم</button>
            <button type="button" data-v="no" aria-pressed={a[q.key] === 'لا'} onClick={() => set(q.key, 'لا' as never)}>لا</button>
          </div>
        )}
        {q.kind === 'choice' && (
          <div className="choice">
            {q.options.map((o) => (
              <button key={o} type="button" aria-pressed={a[q.key] === o} onClick={() => set(q.key, (a[q.key] === o ? '' : o) as never)}>{o}</button>
            ))}
          </div>
        )}
        {q.kind === 'text' && (
          <textarea rows={3} value={a[q.key] as string} placeholder="اكتب هنا…" onChange={(e) => set(q.key, e.target.value as never)} />
        )}
        {bad && <p className="q-err">مطلوب</p>}
      </fieldset>
    )
  }

  return (
    <dialog ref={ref} className="day checkin" aria-label="Weekly check-in" onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}>
      <div className="day-box">
        <header className="day-head">
          <h2><small>WEEKLY</small>check-in</h2>
          <button type="button" className="x" onClick={() => ref.current?.close()} aria-label="Close">&times;</button>
        </header>

        <div className="day-body" ref={bodyRef} dir="rtl" lang="ar">
          {status === 'sent' || status === 'not-configured' ? (
            <div className="ck-done">
              <span className="ck-icon" aria-hidden="true">✓</span>
              <h3>{status === 'sent' ? 'تم إرسال الـ check-in' : 'اتحفظ على الجهاز ده'}</h3>
              <p>{status === 'sent' ? 'وصلت إجاباتك وصورك، هراجعها وأرد عليك قريب 💪' : 'جوجل شيت لسه مش متوصل، الإجابات متسجلتش أونلاين.'}</p>
              <a className="wa-btn" href={waLink} target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>
                ابعتها للكوتش على واتساب
              </a>
              <p className="wa-note">هيفتحلك واتساب والرسالة جاهزة، دوس إرسال بس</p>
              <button type="button" className="logbtn" onClick={() => ref.current?.close()}>تمام</button>
            </div>
          ) : (
            <div className="ck-form">
              <fieldset className={missing.has('weight') ? 'q missing' : 'q'} data-key="weight">
                <legend><span className="q-n">⚖</span>الوزن</legend>
                <div className="ck-weights">
                  <label className="f">
                    <span className="lbl">الوزن الحالي {change}</span>
                    <span className="inp"><input type="number" inputMode="decimal" min={0} step={0.1} placeholder="0" dir="ltr"
                      value={a.weight} onChange={(e) => set('weight', e.target.value)} /><em>kg</em></span>
                  </label>
                  <label className="f">
                    <span className="lbl">الوزن السابق</span>
                    <span className="inp"><input type="number" inputMode="decimal" min={0} step={0.1} placeholder="–" dir="ltr"
                      value={a.prevWeight} onChange={(e) => set('prevWeight', e.target.value)} /><em>kg</em></span>
                  </label>
                </div>
                {missing.has('weight') && <p className="q-err">مطلوب</p>}
              </fieldset>

              {QUESTIONS.map(field)}

              <fieldset className="q">
                <legend><span className="q-n">11</span>ابعتلي صورك على معدة فاضية!</legend>
                <div className="ck-photos">
                  {photos.map((p) => (
                    <figure key={p.id}>
                      <img src={p.preview} alt="" />
                      <button type="button" aria-label="شيل الصورة" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}>&times;</button>
                    </figure>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <label className="ck-add">
                      <input type="file" accept="image/*" multiple onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
                      <span aria-hidden="true">{busyPhotos ? '…' : '+'}</span>
                      <small>{busyPhotos ? 'بجهز الصور' : 'أضف صور'}</small>
                    </label>
                  )}
                </div>
                <p className="ck-hint">لحد {MAX_PHOTOS} صور · قدام وجنب وضهر</p>
              </fieldset>
            </div>
          )}
        </div>

        {status !== 'sent' && status !== 'not-configured' && (
          <>
            {status === 'failed' && (
              <p className="sync sync-queued" role="status">
                مقدرتش أبعت – اتأكد من النت وجرب تاني، أو{' '}
                <a href={whatsappLink(checkinMessage(a, photos.length))} target="_blank" rel="noopener">ابعت الإجابات على واتساب</a>
              </p>
            )}
            {missing.size > 0 && <p className="sync sync-queued" role="status">كمّل الأسئلة المطلوبة الأول</p>}
            <footer className="day-foot">
              <button type="button" className="finish" onClick={submit} disabled={status === 'sending' || busyPhotos}>
                {status === 'sending' ? 'بيتبعت…' : 'إرسال'}
              </button>
            </footer>
          </>
        )}
      </div>
    </dialog>
  )
}
