import type { ReactNode } from 'react'

export type TabId = 'home' | 'transactions' | 'budgets' | 'more'

const ICONS: Record<TabId, ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.7 12 3l9 7.7" />
      <path d="M5.3 9.2V20a1 1 0 0 0 1 1H9.7v-5.6h4.6V21h3.4a1 1 0 0 0 1-1V9.2" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3.5" width="16" height="17" rx="3.5" />
      <path d="M8 8.5h8M8 12h8M8 15.5h4.5" />
    </svg>
  ),
  budgets: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 3.4V12l6.2 5.8" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="2.1" />
      <circle cx="12" cy="12" r="2.1" />
      <circle cx="19" cy="12" r="2.1" />
    </svg>
  ),
}

const ITEMS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Accueil' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'more', label: 'Plus' },
]

export function BottomNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`nav-item ${tab === it.id ? 'active' : ''}`}
          onClick={() => onChange(it.id)}
          aria-current={tab === it.id ? 'page' : undefined}
        >
          <span className="nav-pill">{ICONS[it.id]}</span>
          <span className="nav-label">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}
