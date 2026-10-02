import { useRef } from 'react'

type Props = {
  id: string
  value: string
  step: number
  onChange: (value: string) => void
  inputMode: 'decimal' | 'numeric'
  label: string
  /** starting point when the field is empty (e.g. last session's weight) - shown as the placeholder */
  base?: number
}

export function Stepper({ id, value, step, onChange, inputMode, label, base }: Props) {
  const input = useRef<HTMLInputElement>(null)
  // read the live field value so rapid taps never work from a stale render
  const bump = (dir: 1 | -1) => {
    const el = input.current!
    const typed = parseFloat(el.value)
    const start = isNaN(typed) ? (base ?? 0) : typed
    const next = String(+Math.max(0, start + dir * step).toFixed(2))
    el.value = next
    onChange(next)
  }

  return (
    <span className="inp step">
      <button type="button" onClick={() => bump(-1)} aria-label={`نقّص ${label}`}>
        &minus;
      </button>
      <input
        ref={input}
        id={id}
        type="number"
        inputMode={inputMode}
        min={0}
        step={inputMode === 'numeric' ? 1 : 0.5}
        placeholder={base != null ? String(base) : '0'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" onClick={() => bump(1)} aria-label={`زوّد ${label}`}>
        +
      </button>
    </span>
  )
}
