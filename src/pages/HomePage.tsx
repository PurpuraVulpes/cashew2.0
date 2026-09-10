import { useMemo, useState } from 'react'
import type { TabId } from '../components/BottomNav'
import { MonthScroller } from '../components/MonthScroller'
import { ProgressBar } from '../components/ProgressBar'
import { LineChart } from '../components/charts/LineChart'
import { SubRow } from '../components/SubRow'
import { TxRow } from '../components/TxRow'
import { useSheets } from '../store/SheetsContext'
import { useStore } from '../store/StoreContext'
import { budgetProgress, balanceSeries, monthTxs, minMonth, overallBudget, sortTxDesc, sumTxs, sortedSubs, totalBalance, walletBalance } from '../utils/calc'
import { currentYM, dayOfMonth, daysInMonth, monthLabel, todayISO } from '../utils/dates'
import { convert, formatCompact, formatMoney } from '../utils/money'

export function HomePage({ go }: { go: (t: TabId) => void }) {
  const { data, setSettings, paySubscription } = useStore()
  const { open } = useSheets()
  const cur = data.settings.currency
  const today = todayISO()
  const thisYM = currentYM()

  const [ym, setYm] = useState(thisYM)
  const min = useMemo(() => minMonth(data), [data])

  // ── Dépenses du mois ──────────────────────────────────────────────────
  const monthTx = useMemo(() => monthTxs(data, ym), [data, ym])
  const spent = sumTxs(data, monthTx, 'expense')
  const income = sumTxs(data, monthTx, 'income')
  const overall = overallBudget(data)
  const limit =
    overall?.amount ??
    data.budgets.filter((b) => b.period === 'monthly').reduce((s, b) => s + b.amount, 0)
  const ratio = limit > 0 ? spent / limit : 0
  const dim = daysInMonth(ym)
  const dayNow = ym === thisYM ? dayOfMonth(today) : dim
  const daysLeft = Math.max(dim - dayNow, 0)
  const perDay = Math.max(limit - spent, 0) / Math.max(daysLeft, 1)
  const isCurrent = ym === thisYM

  // ── Graphique de solde ────────────────────────────────────────────────
  const series = useMemo(() => balanceSeries(data, ym), [data, ym])

  // ── Portefeuilles ─────────────────────────────────────────────────────
  const wallets = data.wallets.map((w) => ({
    ...w,
    balance: walletBalance(data, w.id, today),
    count: data.transactions.filter((t) => t.walletId === w.id).length,
  }))

  // ── Abonnements & transactions récentes ───────────────────────────────
  const subs = sortedSubs(data).slice(0, 3)
  const recent = useMemo(() => sortTxDesc(data.transactions).slice(0, 6), [data.transactions])

  return (
    <div className="page-body">
      <div className="topbar">
        <div className="brand">
          <span className="brand-logo">🌰</span>
          <span className="brand-name">Cashew</span>
        </div>
        <button
          className="icon-btn"
          onClick={() => setSettings({ theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' })}
          aria-label="Basculer le thème"
        >
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
          </svg>
        </button>
      </div>

      <header className="page-head">
        <h1>Commençons à budgétiser !</h1>
        <p className="page-sub">Voici votre résumé de {monthLabel(thisYM)}</p>
      </header>

      {/* Portefeuilles */}
      <div className="wallet-strip">
        {wallets.map((w) => (
          <button key={w.id} className="wallet-card" onClick={() => open({ kind: 'wallet', wallet: w })} type="button">
            <span className="wallet-card-top">
              <span className="wallet-card-name">{w.name}</span>
              <span className="dot" style={{ background: w.color }} />
            </span>
            <span className="wallet-card-balance">
              {formatMoney(w.balance, w.currency, Math.abs(w.balance) >= 1000 ? 0 : 2)}
            </span>
            <span className="wallet-card-count">
              {w.count} transaction{w.count > 1 ? 's' : ''}
            </span>
          </button>
        ))}
        <button className="wallet-card add" onClick={() => open({ kind: 'wallet' })} type="button">
          <span className="wallet-card-plus">+</span>
          <span className="wallet-card-count">Portefeuille</span>
        </button>
      </div>

      {/* Dépenses du mois */}
      <section className="card spending-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Dépenses {isCurrent ? 'du mois' : `— ${monthLabel(ym)}`}</h2>
            <p className="spending-sub">
              <strong>{formatMoney(Math.max(spent, 0), cur, spent >= 1000 ? 0 : 2)}</strong>{' '}
              {limit > 0 ? (
                <>
                  sur {formatMoney(limit, cur, 0)} {isCurrent && ratio > 1 ? '· budget dépassé' : ''}
                </>
              ) : (
                'dépensés'
              )}
            </p>
          </div>
          {limit > 0 && (
            <div className="card-head-actions">
              <span className="spending-total">{formatMoney(income - spent, cur, 0)} net</span>
            </div>
          )}
        </div>

        {limit > 0 && (
          <ProgressBar
            ratio={ratio}
            marker={isCurrent ? dayNow / dim : 1}
            label={`${Math.round(ratio * 100)} %`}
          />
        )}

        <div className="progress-dates">
          <span>1 {monthLabel(ym).split(' ')[0].slice(0, 4)}.</span>
          {limit > 0 && isCurrent && (
            <span className="progress-hint">
              Vous pouvez encore dépenser {formatMoney(Math.max(perDay, 0), cur, 0)} par jour pendant {daysLeft} jour{daysLeft > 1 ? 's' : ''}
            </span>
          )}
          <span>{dim} {monthLabel(ym).split(' ')[0].slice(0, 4)}.</span>
        </div>

        <MonthScroller value={ym} min={min} onChange={setYm} />
      </section>

      {/* Évolution du solde */}
      <section className="card">
        <h2 className="card-title">Évolution du solde</h2>
        <p className="card-subtitle">{monthLabel(ym)} · tous portefeuilles</p>
        <LineChart
          points={series}
          formatY={(n) => formatCompact(n, cur)}
          formatTip={(n) => formatMoney(n, cur, 0)}
          xLabel={(d) => `${d} ${monthLabel(ym).split(' ')[0].slice(0, 4)}.`}
        />
        <div className="chart-foot">
          <span>
            Solde total : <strong>{formatMoney(totalBalance(data, today), cur, 0)}</strong>
          </span>
        </div>
      </section>

      {/* Abonnements */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Abonnements à venir</h2>
          <button className="link-btn" onClick={() => open({ kind: 'subs-list' })}>
            Tout voir
          </button>
        </div>
        {subs.length === 0 ? (
          <div className="empty small">
            <span className="empty-emoji">🔁</span>
            <p>Aucun abonnement suivi.</p>
          </div>
        ) : (
          <div className="list">
            {subs.map((sub) => (
              <SubRow
                key={sub.id}
                sub={sub}
                onEdit={() => open({ kind: 'subscription', sub })}
                onPay={() => {
                  paySubscription(sub.id)
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Transactions récentes */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Transactions récentes</h2>
          <button className="link-btn" onClick={() => go('transactions')}>
            Tout voir
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="empty small">
            <span className="empty-emoji">🌰</span>
            <p>Ajoutez votre première transaction avec le bouton +</p>
          </div>
        ) : (
          <div className="list">
            {recent.map((t) => (
              <TxRow key={t.id} tx={t} onClick={() => open({ kind: 'transaction', tx: t })} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
