import type { ReactNode } from 'react'
import type { Category } from '../types'

/** Pastille ronde colorée avec emoji, à la Cashew. */
export function CategoryIcon({
  cat,
  size = 44,
  repeat = false,
  children,
}: {
  cat?: Pick<Category, 'emoji' | 'color'> | null
  size?: number
  repeat?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className="cat-icon"
      style={{
        width: size,
        height: size,
        background: cat?.color ?? '#8a9186',
        fontSize: Math.round(size * 0.46),
      }}
    >
      <span>{cat?.emoji ?? '📦'}</span>
      {repeat && (
        <span className="cat-icon-badge" aria-hidden>
          <svg viewBox="0 0 24 24" width={size * 0.42} height={size * 0.42} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
          </svg>
        </span>
      )}
      {children}
    </div>
  )
}
