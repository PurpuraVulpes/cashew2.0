import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { CATEGORY_COLORS, EMOJI_PALETTE } from '../data/categories'

// ─── Champs de formulaire ────────────────────────────────────────────────────

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="select-wrap">
      <select className="input select" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg className="select-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`segment ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="emoji-picker">
      <div className="emoji-preview">{value || '❓'}</div>
      <div className="emoji-grid">
        {EMOJI_PALETTE.map((e) => (
          <button
            key={e}
            type="button"
            className={`emoji-cell ${e === value ? 'active' : ''}`}
            onClick={() => onChange(e)}
            aria-label={`Emoji ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ColorSwatches({
  colors,
  value,
  onChange,
}: {
  colors: string[]
  value: string
  onChange: (c: string) => void
}) {
  return (
    <div className="swatches">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${c === value ? 'active' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`Couleur ${c}`}
        >
          {c === value && (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}

export { CATEGORY_COLORS }
