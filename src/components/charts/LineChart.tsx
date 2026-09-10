import { useMemo, useRef, useState } from 'react'

export interface LinePoint {
  x: number
  y: number
}

const W = 320
const H = 170
const PAD = { l: 46, r: 12, t: 16, b: 24 }

/** Graphique d'évolution (aire) avec infobulle tactile. */
export function LineChart({
  points,
  color = 'var(--accent)',
  formatY,
  formatTip,
  xLabel,
}: {
  points: LinePoint[]
  color?: string
  formatY: (n: number) => string
  formatTip: (n: number) => string
  xLabel: (x: number) => string
}) {
  const gid = useMemo(() => Math.random().toString(36).slice(2, 8), [])
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  if (points.length === 0) {
    return <div className="chart-empty">Pas encore de données</div>
  }

  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const n = points.length

  let yMin = Math.min(0, ...points.map((p) => p.y))
  let yMax = Math.max(0, ...points.map((p) => p.y))
  const span = yMax - yMin || 1
  yMin -= span * 0.06
  yMax += span * 0.08

  const sx = (i: number) => PAD.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const sy = (y: number) => PAD.t + (1 - (y - yMin) / (yMax - yMin)) * innerH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ')
  const base = H - PAD.b
  const area = `${line} L${sx(n - 1).toFixed(1)} ${base} L${sx(0).toFixed(1)} ${base} Z`

  const ticks: number[] = [yMin + (yMax - yMin) * 0.06, (yMin + yMax) / 2, yMax - (yMax - yMin) * 0.04]
  const xTickIdx = [0, Math.floor((n - 1) / 3), Math.floor((2 * (n - 1)) / 3), n - 1].filter(
    (v, i, a) => a.indexOf(v) === i,
  )

  const onMove = (e: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((px - PAD.l) / innerW) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, idx)))
  }

  const hp = hover !== null ? points[hover] : null
  const tipFlip = hp !== null && sx(hover!) > W - 96

  return (
    <svg
      ref={svgRef}
      className="line-chart"
      viewBox={`0 0 ${W} ${H}`}
      onPointerMove={onMove}
      onPointerDown={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={`grad-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={sy(t)}
            y2={sy(t)}
            className="chart-gridline"
          />
          <text x={PAD.l - 6} y={sy(t) + 3} className="chart-tick" textAnchor="end">
            {formatY(t)}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#grad-${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

      {xTickIdx.map((i) => (
        <text key={i} x={sx(i)} y={H - 7} className="chart-tick" textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
          {xLabel(points[i].x)}
        </text>
      ))}

      {hp && hover !== null && (
        <g>
          <line x1={sx(hover)} x2={sx(hover)} y1={PAD.t} y2={base} className="chart-cursor" />
          <circle cx={sx(hover)} cy={sy(hp.y)} r="4.2" fill={color} stroke="var(--card)" strokeWidth="2" />
          <g transform={`translate(${tipFlip ? sx(hover) - 8 : sx(hover) + 8}, ${Math.max(sy(hp.y) - 30, PAD.t)})`}>
            <rect
              x={tipFlip ? -74 : 0}
              y="0"
              width="74"
              height="24"
              rx="7"
              className="chart-tip-bg"
            />
            <text x={tipFlip ? -37 : 37} y="11" textAnchor="middle" className="chart-tip-title">
              {xLabel(points[hover].x)}
            </text>
            <text x={tipFlip ? -37 : 37} y="20" textAnchor="middle" className="chart-tip-value">
              {formatTip(hp.y)}
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}
