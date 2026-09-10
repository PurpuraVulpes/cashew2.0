import { clamp } from '../utils/ui'

/** Barre de progression avec pourcentage et marqueur « Aujourd'hui ». */
export function ProgressBar({
  ratio,
  marker,
  label,
  small = false,
}: {
  ratio: number
  /** Position 0-1 du marqueur (aujourd'hui) */
  marker?: number
  /** Texte affiché près du remplissage, ex. « 75 % » */
  label?: string
  small?: boolean
}) {
  const pct = clamp(ratio, 0, 1)
  const over = ratio > 1
  // Le libellé blanc centré n'est lisible que si le remplissage atteint le centre.
  const labelInside = ratio >= 0.55
  return (
    <div className={`progress ${small ? 'progress-sm' : ''}`}>
      {marker !== undefined && marker > 0 && marker < 1 && (
        <>
          <span className="progress-marker" style={{ left: `${clamp(marker, 0, 1) * 100}%` }} />
          <span className="progress-marker-tag" style={{ left: `${clamp(marker, 0.06, 0.94) * 100}%` }}>
            Aujourd’hui
          </span>
        </>
      )}
      <div className="progress-track">
        <div
          className={`progress-fill ${over ? 'over' : ''}`}
          style={{ width: `${pct * 100}%` }}
        />
        {label && labelInside && <span className="progress-label inside">{label}</span>}
        {label && !labelInside && (
          <span className="progress-label outside" style={{ left: `calc(${pct * 100}% + 10px)` }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

/** Anneau de progression (budget global). */
export function Ring({
  ratio,
  size = 148,
  thickness = 13,
  children,
}: {
  ratio: number
  size?: number
  thickness?: number
  children?: React.ReactNode
}) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const pct = clamp(ratio, 0, 1)
  const over = ratio > 1
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="ring-track"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className={`ring-fill ${over ? 'over' : ''}`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
