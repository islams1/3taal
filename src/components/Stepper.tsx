import { useRef } from 'react'

type Props = {
  id: string
  value: string
  step: number
  onChange: (value: string) => void
  inputMode: 'decimal' | 'numeric'
  label: string
}

export function Stepper({ id, value, step, onChange, inputMode, label }: Props) {
  const input = useRef<HTMLInputElement>(null)
  // read the live field value so rapid taps never work from a stale render
  const bump = (dir: 1 | -1) => {
    const el = input.current!
    const next = String(+Math.max(0, (parseFloat(el.value) || 0) + dir * step).toFixed(2))
    el.value = next
    onChange(next)
  }

  return (
    <span className="inp step">
      <button type="button" onClick={() => bump(-1)} aria-label={`Decrease ${label}`}>
        &minus;
      </button>
      <input
        ref={input}
        id={id}
        type="number"
        inputMode={inputMode}
        min={0}
        step={inputMode === 'numeric' ? 1 : 0.5}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" onClick={() => bump(1)} aria-label={`Increase ${label}`}>
        +
      </button>
    </span>
  )
}
