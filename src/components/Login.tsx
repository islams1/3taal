import type { CSSProperties } from 'react'

export type Role = 'islam' | 'shady'

// dumbbell for the trainee, clipboard for the coach
const ICONS: Record<Role, string> = {
  islam: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  shady: 'M9 4h6v3H9zM8 5.5H6a1 1 0 00-1 1V20a1 1 0 001 1h12a1 1 0 001-1V6.5a1 1 0 00-1-1h-2M9 12l2 2 4-4M9 17h6',
}

const USERS: { role: Role; name: string; note: string }[] = [
  { role: 'islam', name: 'إسلام', note: 'المتدرب · التمارين والـ check-in' },
  { role: 'shady', name: 'شادي', note: 'الكوتش · متابعة السجل' },
]

/** Who is using the site. Not a security boundary - just picks the screen. */
export function Login({ onPick }: { onPick: (role: Role) => void }) {
  return (
    <section className="login" dir="rtl" aria-label="اختار المستخدم">
      <p className="login-q">مين بيدخل؟</p>
      <div className="login-btns">
        {USERS.map((u, i) => (
          <button key={u.role} type="button" className={`login-btn ${u.role}`} onClick={() => onPick(u.role)}
            style={{ '--i': i } as CSSProperties}>
            <span className="login-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={ICONS[u.role]} /></svg></span>
            <span className="login-text">
              <b>{u.name}</b>
              <small>{u.note}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
