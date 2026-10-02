import type { CSSProperties } from 'react'

export function Ring({ value, big = false }: { value: number; big?: boolean }) {
  return (
    <span className={big ? 'ring big' : 'ring'} data-level={value >= 100 ? 'done' : value >= 50 ? 'mid' : undefined} style={{ '--p': value } as CSSProperties}>
      <b>{value}%</b>
    </span>
  )
}
