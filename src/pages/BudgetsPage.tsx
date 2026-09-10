import { useMemo, useState } from 'react'
import type { YM } from '../types'
import { Donut } from '../components/charts/Donut'
import type { DonutSegment } from '../components/charts/Donut'
import { MonthlyBars } from '../components/charts/MonthlyBars'
import { MonthScroller } from '../components/MonthScroller'
import { ProgressBar, Ring } from '../components/ProgressBar'
import { TxRow } from '../components/TxRow'
import { useSheets } from '../store/SheetsContext'
import { useStore } from '../store/StoreContext'
import { addMonthsYM } from '../utils/dates'
import {
  budgetProgress,
  categoryOf,
  monthTxs,
  minMonth,
  overallBudget,
  periodLabel,
  sortTxDesc,
  spendByCategory,
  sumTxs,
  txToMain,
} from '../utils/calc'
import { currentYM, monthLabel, shortMonthLabel, todayISO } from '../utils/dates'
import { formatCompact, formatMoney } from '../utils/money'
import { Segmented } from '../components/Controls'

type Tab = 'budgets' | 'stats'

export function BudgetsPage() {
  const [tab, setTab] = useState<Tab>('budgets')

  return (
    <div className="page-body">
      <header className="page-head">
        <h1>Budgets</h1>
      </header>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'budgets', label: '🎯 Budgets' },
          { value: 'stats', label: '📊 Statistiques' },
        ]}
      />
      {tab === 'budgets' ? <BudgetsTab /> : <StatsTab />}
    </div>
  )
}

// ─── Onglet Budgets ──────────────────────────────────────────────────────────

function BudgetsTab() {
  const { data } = useStore()
  const { open } = useSheets()
  const cur = data.settings.currency
  const today = todayISO()
  const overall = overallBudget(data)
  const others = data.budgets.filter((b) => b.id !== overall?.id)

  const overallProg = overall ? budgetProgress(data, overall, today) : null

  return (
    <>
      {overall && overallProg ? (
        <section className="card overall-card">
          <div className="overall-head">
            <span className="overall-emoji">{overall.emoji}</span>
            <div>
              <h2 className="card-title">{overall.name}</h2>
              <p className="muted">
                {periodLabel(overall)} · {overallProg.daysLeft > 0 ? `${overallProg.daysLeft} j restants` : 'période terminée'}
              </p>
            </div>
          </div>
          <Ring ratio={overallProg.ratio}>
            <span className="ring-pct">{Math.round(overallProg.ratio * 100)} %</span>
            <span className="ring-sub">dépensé</span>
          </Ring>
          <p className="overall-amounts">
            <strong>{formatMoney(overallProg.spent, cur, 0)}</strong> sur {formatMoney(overallProg.limit, cur, 0)}
            {overallProg.remaining >= 0 ? (
              <span className="muted"> · {formatMoney(overallProg.remaining, cur, 0)} restants</span>
            ) : (
              <span className="over-text"> · {formatMoney(-overallProg.remaining, cur, 0)} de trop</span>
            )}
          </p>
          <button className="link-btn" onClick={() => open({ kind: 'budget', budget: overall })}>
            Modifier
          </button>
        </section>
      ) : (
        <button className="card cta-card" onClick={() => open({ kind: 'budget' })} type="button">
          <span className="empty-emoji">🎯</span>
          <div>
            <strong>Créez un budget global</strong>
            <p className="muted">Suivez toutes vos dépenses du mois d’un coup d’œil.</p>
          </div>
        </button>
      )}

      {others.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji">🧮</span>
          <p>Aucun budget par catégorie</p>
          <p className="muted">Créez des budgets par catégorie pour vos courses, loisirs…</p>
        </div>
      ) : (
        <div className="budget-list">
          {others.map((b) => {
            const p = budgetProgress(data, b, today)
            const cats = b.categoryIds ?? null
            return (
              <button key={b.id} className="card budget-card" onClick={() => open({ kind: 'budget', budget: b })} type="button">
                <div className="budget-head">
                  <span className="budget-emoji" style={{ background: 'var(--card-2)' }}>{b.emoji}</span>
                  <div className="budget-names">
                    <span className="budget-name">{b.name}</span>
                    <span className="budget-meta">
                      {periodLabel(b)}
                      {cats && cats.length > 0 && (
                        <>
                          {' · '}
                          {cats
                            .map((id) => categoryOf(data, id))
                            .filter(Boolean)
                            .map((c) => c!.emoji)
                            .join(' ')}
                        </>
                      )}
                    </span>
                  </div>
                  <span className={`budget-remaining ${p.remaining < 0 ? 'over' : ''}`}>
                    {p.remaining < 0
                      ? `−${formatMoney(-p.remaining, cur, 0)}`
                      : formatMoney(p.remaining, cur, 0)}
                  </span>
                </div>
                <ProgressBar ratio={p.ratio} small label={`${Math.round(p.ratio * 100)} %`} />
                <p className="budget-foot">
                  {formatMoney(p.spent, cur, 0)} dépensés sur {formatMoney(p.limit, cur, 0)}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

// ─── Onglet Statistiques ─────────────────────────────────────────────────────

function StatsTab() {
  const { data } = useStore()
  const { open } = useSheets()
  const cur = data.settings.currency
  const thisYM = currentYM()
  const [ym, setYm] = useState(thisYM)
  const min = useMemo(() => minMonth(data), [data])

  const txs = useMemo(() => monthTxs(data, ym), [data, ym])
  const income = sumTxs(data, txs, 'income')
  const expense = sumTxs(data, txs, 'expense')
  const net = income - expense

  const segments: DonutSegment[] = useMemo(() => {
    const byCat = spendByCategory(data, txs)
    return [...byCat.entries()]
      .map(([id, value]) => {
        const c = categoryOf(data, id)
        return { key: id, label: c?.name ?? 'Autre', value, color: c?.color ?? '#8a9186' }
      })
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [data, txs])

  const sixMonths = useMemo(() => {
    const out: { label: string; expense: number; income: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const m = addMonthsYM(ym, -i)
      const mtx = monthTxs(data, m)
      out.push({
        label: shortMonthLabel(m),
        expense: sumTxs(data, mtx, 'expense'),
        income: sumTxs(data, mtx, 'income'),
      })
    }
    return out
  }, [data, ym])

  const top = useMemo(
    () =>
      sortTxDesc(txs.filter((t) => t.type === 'expense'))
        .sort((a, b) => txToMain(data, b) - txToMain(data, a))
        .slice(0, 5),
    [txs, data],
  )

  return (
    <>
      <MonthScroller value={ym} min={min} onChange={setYm} />

      <section className="card">
        <h2 className="card-title">Bilan — {monthLabel(ym)}</h2>
        <div className="stat-tiles">
          <div className="stat-tile">
            <span className="stat-label">Revenus</span>
            <span className="stat-value income">{formatMoney(income, cur, 0)}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Dépenses</span>
            <span className="stat-value expense">{formatMoney(expense, cur, 0)}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Net</span>
            <span className={`stat-value ${net >= 0 ? 'income' : 'expense'}`}>{formatMoney(net, cur, 0)}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Dépenses par catégorie</h2>
        {segments.length === 0 ? (
          <div className="empty small">
            <span className="empty-emoji">🥧</span>
            <p>Aucune dépense en {monthLabel(ym)}</p>
          </div>
        ) : (
          <div className="donut-wrap">
            <Donut segments={segments} centerTop={formatMoney(expense, cur, 0)} centerBottom="dépensés" />
            <div className="legend">
              {segments.slice(0, 6).map((s) => (
                <div className="legend-row" key={s.key}>
                  <span className="legend-dot" style={{ background: s.color }} />
                  <span className="legend-name">{s.label}</span>
                  <span className="legend-amt">{formatMoney(s.value, cur, 0)}</span>
                  <span className="legend-pct">{Math.round((s.value / expense) * 100)} %</span>
                </div>
              ))}
              {segments.length > 6 && (
                <div className="legend-row">
                  <span className="legend-dot" style={{ background: 'var(--text-2)' }} />
                  <span className="legend-name">Autres ({segments.length - 6})</span>
                  <span className="legend-amt">
                    {formatMoney(segments.slice(6).reduce((s, x) => s + x.value, 0), cur, 0)}
                  </span>
                  <span className="legend-pct">
                    {Math.round((segments.slice(6).reduce((s, x) => s + x.value, 0) / expense) * 100)} %
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">6 derniers mois</h2>
        <p className="card-subtitle">
          <span className="legend-dot inline income" /> revenus ·{' '}
          <span className="legend-dot inline expense" /> dépenses
        </p>
        <MonthlyBars items={sixMonths} format={(n) => formatCompact(n, cur)} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Plus grosses dépenses</h2>
          <span className="muted">{monthLabel(ym)}</span>
        </div>
        {top.length === 0 ? (
          <div className="empty small">
            <span className="empty-emoji">🔝</span>
            <p>Rien à afficher</p>
          </div>
        ) : (
          <div className="list">
            {top.map((t) => (
              <TxRow key={t.id} tx={t} onClick={() => open({ kind: 'transaction', tx: t })} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
