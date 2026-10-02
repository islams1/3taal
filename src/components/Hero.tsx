import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

// jagged bolt paths, drawn in a 100x300 box
const BOLTS = [
  'M60 0 L42 70 L58 74 L30 150 L50 154 L18 240 L34 244 L10 300',
  'M40 0 L58 60 L44 66 L70 140 L52 146 L80 220 L64 226 L90 300',
]

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  // embers: random but stable for the life of the page
  const embers = useMemo(
    () =>
      Array.from({ length: 26 }, () => ({
        left: `${Math.random() * 100}%`,
        size: `${2 + Math.random() * 3}px`,
        dur: `${7 + Math.random() * 9}s`,
        delay: `${-Math.random() * 16}s`,
        drift: `${(Math.random() - 0.5) * 120}px`,
      })),
    [],
  )

  // gentle 3D tilt that follows the pointer
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = e.clientX / innerWidth - 0.5
        const y = e.clientY / innerHeight - 0.5
        el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`)
        el.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`)
      })
    }
    addEventListener('pointermove', onMove)
    return () => {
      removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="hero" aria-label="عتال — Shady Tarek">
      <div className="hero-bg" aria-hidden="true">
        <span className="glow" />
        {BOLTS.map((d, i) => (
          <svg key={i} className={`bolt bolt-${i}`} viewBox="0 0 100 300" preserveAspectRatio="none">
            <path d={d} pathLength={1} />
          </svg>
        ))}
        <span className="flash" />
        {embers.map((e, i) => (
          <i
            key={i}
            className="ember"
            style={{ left: e.left, width: e.size, height: e.size, animationDuration: e.dur, animationDelay: e.delay, '--drift': e.drift } as CSSProperties}
          />
        ))}
      </div>

      <div className="logo" ref={ref}>
        <h1 className="logo-ar" lang="ar" dir="rtl">عتــــــال</h1>
        <p className="logo-sign">Shady Tarek</p>
      </div>
      <p className="tagline">WORKOUT PLAN</p>
    </section>
  )
}
