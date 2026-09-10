const W = 320
const H = 180
const PAD = { l: 8, r: 8, t: 20, b: 22 }

/** Barres mensuelles groupées : dépenses vs revenus sur 6 mois. */
export function MonthlyBars({
  items,
  format,
}: {
  items: { label: string; expense: number; income: number }[]
  format: (n: number) => string
}) {
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const max = Math.max(1, ...items.flatMap((i) => [i.expense, i.income]))
  const slot = innerW / Math.max(items.length, 1)
  const barW = Math.min(12, (slot - 14) / 2)
  const groupW = barW * 2 + 4

  return (
    <svg className="bars-chart" viewBox={`0 0 ${W} ${H}`}>
      {items.map((it, i) => {
        const cx = PAD.l + slot * i + slot / 2
        const x0 = cx - groupW / 2
        const hE = (it.expense / max) * innerH
        const hI = (it.income / max) * innerH
        return (
          <g key={it.label}>
            <rect x={x0} y={PAD.t + innerH - hE} width={barW} height={Math.max(hE, 2)} rx={3.5} className="bar-expense">
              <title>{`Dépenses : ${format(it.expense)}`}</title>
            </rect>
            <rect x={x0 + barW + 4} y={PAD.t + innerH - hI} width={barW} height={Math.max(hI, 2)} rx={3.5} className="bar-income">
              <title>{`Revenus : ${format(it.income)}`}</title>
            </rect>
            <text x={cx} y={PAD.t + innerH - Math.max(hE, hI) - 6} textAnchor="middle" className="bar-value">
              {it.expense > 0 || it.income > 0 ? format(Math.max(it.expense, it.income)) : ''}
            </text>
            <text x={cx} y={H - 6} textAnchor="middle" className="bar-label">
              {it.label}
            </text>
          </g>
        )
      })}
      <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + innerH} y2={PAD.t + innerH} className="chart-gridline" />
    </svg>
  )
}
