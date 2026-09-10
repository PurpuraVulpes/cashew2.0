export interface DonutSegment {
  key: string
  label: string
  value: number
  color: string
}

/** Graphique donut (dépenses par catégorie). */
export function Donut({
  segments,
  size = 192,
  thickness = 27,
  centerTop,
  centerBottom,
}: {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  centerTop: string
  centerBottom: string
}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const gap = total > 0 ? 2.6 : 0
  let acc = 0

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="donut-track" strokeWidth={thickness} />
          {total > 0 &&
            segments.map((s) => {
              const frac = s.value / total
              const len = Math.max(frac * c - gap, 0.6)
              const off = -acc
              acc += frac * c
              return (
                <circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={off}
                />
              )
            })}
        </g>
      </svg>
      <div className="donut-center">
        <span className="donut-top">{centerTop}</span>
        <span className="donut-bottom">{centerBottom}</span>
      </div>
    </div>
  )
}
