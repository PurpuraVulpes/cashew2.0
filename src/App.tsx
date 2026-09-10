import { useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import type { TabId } from './components/BottomNav'
import { ConfirmHost } from './components/Confirm'
import { BudgetsPage } from './pages/BudgetsPage'
import { HomePage } from './pages/HomePage'
import { MorePage } from './pages/MorePage'
import { TransactionsPage } from './pages/TransactionsPage'
import { StoreProvider, useStore } from './store/StoreContext'
import { SheetsProvider, useSheets } from './store/SheetsContext'
import { todayISO } from './utils/dates'

export default function App() {
  return (
    <StoreProvider>
      <SheetsProvider>
        <Theming />
        <Layout />
        <ConfirmHost />
      </SheetsProvider>
    </StoreProvider>
  )
}

/** Applique le thème (clair/sombre/système) et la couleur d'accent. */
function Theming() {
  const { data } = useStore()

  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const mode =
        data.settings.theme === 'system' ? (mq.matches ? 'dark' : 'light') : data.settings.theme
      root.dataset.theme = mode
      root.dataset.accent = data.settings.accent
      const meta = document.querySelector('meta[name="theme-color"]')
      meta?.setAttribute('content', mode === 'dark' ? '#141715' : '#eef3ea')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [data.settings.theme, data.settings.accent])

  return null
}

function Layout() {
  const { open } = useSheets()
  const [tab, setTab] = useState<TabId>('home')

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  const onFab = () => {
    if (tab === 'budgets') open({ kind: 'budget' })
    else open({ kind: 'transaction', defaults: { date: todayISO() } })
  }

  return (
    <div className="app">
      <main className="page" key={tab}>
        {tab === 'home' && <HomePage go={setTab} />}
        {tab === 'transactions' && <TransactionsPage />}
        {tab === 'budgets' && <BudgetsPage />}
        {tab === 'more' && <MorePage />}
      </main>

      {tab !== 'more' && (
        <button className="fab" onClick={onFab} aria-label="Ajouter" type="button">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}
