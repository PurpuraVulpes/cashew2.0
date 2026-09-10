import { useEffect, useMemo, useRef } from 'react'
import type { YM } from '../types'
import { addMonthsYM, currentYM, shortMonthLabel } from '../utils/dates'

/** Liste défilante de mois (pills), sélection centrée automatiquement. */
export function MonthScroller({
  value,
  min,
  onChange,
}: {
  value: YM
  min: YM
  onChange: (ym: YM) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const max = currentYM()

  const months = useMemo(() => {
    const list: YM[] = []
    let y = min
    let guard = 0
    while (y <= max && guard < 240) {
      list.push(y)
      y = addMonthsYM(y, 1)
      guard += 1
    }
    return list.length > 0 ? list : [max]
  }, [min, max])

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[data-active="true"]')
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [value, months.length])

  const thisYear = max.slice(0, 4)

  return (
    <div className="month-scroller" ref={ref} role="tablist" aria-label="Mois">
      {months.map((m) => {
        const active = m === value
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active}
            className={`month-pill ${active ? 'active' : ''}`}
            onClick={() => onChange(m)}
          >
            {shortMonthLabel(m)}
            {m.slice(0, 4) !== thisYear ? ` ${m.slice(2, 4)}` : ''}
          </button>
        )
      })}
    </div>
  )
}
