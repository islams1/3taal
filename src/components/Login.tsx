import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { checkPin } from '../lib/sheetSync'

export type Role = 'islam' | 'shady'

// dumbbell for the trainee, clipboard for the coach
const ICONS: Record<Role, string> = {
  islam: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  shady: 'M9 4h6v3H9zM8 5.5H6a1 1 0 00-1 1V20a1 1 0 001 1h12a1 1 0 001-1V6.5a1 1 0 00-1-1h-2M9 12l2 2 4-4M9 17h6',
}

const USERS: { role: Role; name: string; note: string; needs: 'trainee' | 'coach' }[] = [
  { role: 'islam', name: 'Islam', note: 'Trainee · workouts & check-in', needs: 'trainee' },
  { role: 'shady', name: 'Shady', note: 'Coach · progress review', needs: 'coach' },
]

/**
 * Pick who you are, then the password. The Apps Script checks it on every
 * request, so a wrong or missing password can't read or write the sheet.
 */
export function Login({ onPick }: { onPick: (role: Role, pin: string) => void }) {
  const [picked, setPicked] = useState<(typeof USERS)[number] | null>(null)
  const [pin, setPin] = useState('')
  const [state, setState] = useState<'idle' | 'checking' | 'wrong' | 'offline'>('idle')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (picked) input.current?.focus()
  }, [picked])

  const choose = async (u: (typeof USERS)[number]) => {
    setPicked(u)
    setPin('')
    setState('checking')
    // no passwords set on the sheet yet → straight in
    try {
      if ((await checkPin('')) === 'open') return onPick(u.role, '')
      setState('idle')
    } catch {
      setState('idle')
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!picked || !pin) return
    setState('checking')
    try {
      const role = await checkPin(pin)
      if (role === 'open' || role === picked.needs || (picked.needs === 'coach' && role === 'trainee')) onPick(picked.role, pin)
      else setState('wrong')
    } catch {
      setState('offline')
    }
  }

  return (
    <section className="login" aria-label="Sign in">
      <p className="login-q">Who's training?</p>
      <div className="login-btns">
        {USERS.map((u, i) => (
          <button key={u.role} type="button" className={`login-btn ${u.role}${picked?.role === u.role ? ' picked' : ''}`}
            onClick={() => choose(u)} style={{ '--i': i } as CSSProperties} aria-pressed={picked?.role === u.role}>
            <span className="login-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={ICONS[u.role]} /></svg></span>
            <span className="login-text">
              <b>{u.name}</b>
              <small>{u.note}</small>
            </span>
          </button>
        ))}
      </div>

      {picked && (
        <form className="pin-form" onSubmit={submit}>
          <label htmlFor="pin">Password for {picked.name}</label>
          <div className="pin-row">
            <input ref={input} id="pin" type="password" autoComplete="current-password" value={pin}
              onChange={(e) => { setPin(e.target.value); if (state === 'wrong') setState('idle') }}
              aria-invalid={state === 'wrong'} disabled={state === 'checking'} />
            <button type="submit" className="finish" disabled={!pin || state === 'checking'}>
              {state === 'checking' ? 'Checking…' : 'Enter'}
            </button>
          </div>
          {state === 'wrong' && <p className="pin-msg bad">Wrong password</p>}
          {state === 'offline' && <p className="pin-msg bad">Couldn't reach the server – check your connection</p>}
        </form>
      )}
    </section>
  )
}
