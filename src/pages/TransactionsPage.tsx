import { useMemo, useState } from 'react'
import type { ISODate, Transaction } from '../types'
import { MonthScroller } from '../components/MonthScroller'
import { TxRow } from '../components/TxRow'
import { useSheets } from '../store/SheetsContext'
import { useStore } from '../store/StoreContext'
import { categoryOf, minMonth, monthTxs, sortTxDesc, sumTxs } from '../utils/calc'
import { currentYM, formatDateLong, monthLabel, todayISO } from '../utils/dates'
import { formatMoney } from '../utils/money'

type TypeFilter = 'all' | 'expense' | 'income'

export function TransactionsPage() {
  const { data } = useStore()
  const { open } = useSheets()
  const cur = data.settings.currency
  const [ym, setYm] = useState(currentYM())
  const [query, setQuery] = useState('')
  const [typeF, setTypeF] = useState<TypeFilter>('all')
  const [catF, setCatF] = useState<string[]>([])

  const min = useMemo(() => minMonth(data), [data])
  const monthTx = useMemo(() => monthTxs(data, ym), [data, ym])
  const expenseTotal = sumTxs(data, monthTx, 'expense')
  const incomeTotal = sumTxs(data, monthTx, 'income')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortTxDesc(
      monthTx.filter((t) => {
        if (typeF !== 'all' && t.type !== typeF) return false
        if (catF.length > 0 && !catF.includes(t.categoryId)) return false
        if (q) {
          const cat = categoryOf(data, t.categoryId)
          const hay = `${t.title} ${cat?.name ?? ''} ${t.note ?? ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      }),
    )
  }, [monthTx, query, typeF, catF, data])

  const groups = useMemo(() => {
    const map = new Map<ISODate, Transaction[]>()
    for (const t of filtered) {
      const list = map.get(t.date)
      if (list) list.push(t)
      else map.set(t.date, [t])
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, txs]) => {
        let net = 0
        for (const t of txs) {
          net += t.type === 'income' ? t.amount : -t.amount
        }
        return { date, txs, net }
      })
  }, [filtered])

  const filtersOn = typeF !== 'all' || catF.length > 0 || query.trim() !== ''

  return (
    <div className="page-body">
      <header className="page-head">
        <h1>Transactions</h1>
      </header>

      <MonthScroller value={ym} min={min} onChange={setYm} />

      <div className="summary-bar">
        <button
          className={`summary-cell ${typeF === 'expense' ? 'active' : ''}`}
          onClick={() => setTypeF(typeF === 'expense' ? 'all' : 'expense')}
          type="button"
          title="Filtrer les dépenses"
        >
          <span className="summary-arrow expense" aria-hidden>▼</span>
          <span className="summary-value">{formatMoney(expenseTotal, cur, expenseTotal >= 10000 ? 0 : 2)}</span>
        </button>
        <button
          className={`summary-cell ${typeF === 'income' ? 'active' : ''}`}
          onClick={() => setTypeF(typeF === 'income' ? 'all' : 'income')}
          type="button"
          title="Filtrer les revenus"
        >
          <span className="summary-arrow income" aria-hidden>▲</span>
          <span className="summary-value">{formatMoney(incomeTotal, cur, incomeTotal >= 10000 ? 0 : 2)}</span>
        </button>
        <button
          className={`summary-cell net ${typeF === 'all' ? 'active' : ''}`}
          onClick={() => setTypeF('all')}
          type="button"
          title="Aucun filtre"
        >
          <span className="summary-eq" aria-hidden>=</span>
          <span className="summary-value">{formatMoney(incomeTotal - expenseTotal, cur, 0)}</span>
        </button>
      </div>

      <div className="search-row">
        <div className="search-field">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <input
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher une transaction"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="Effacer">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="chips scroll-x">
        <button
          className={`chip ${catF.length === 0 ? 'active' : ''}`}
          onClick={() => setCatF([])}
          type="button"
        >
          Toutes catégories
        </button>
        {data.categories.map((c) => (
          <button
            key={c.id}
            className={`chip ${catF.includes(c.id) ? 'active' : ''}`}
            onClick={() => setCatF((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))}
            type="button"
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {data.transactions.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji">🌰</span>
          <p>Aucune transaction</p>
          <p className="muted">Touchez le bouton + pour commencer</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji">🔍</span>
          <p>Aucun résultat en {monthLabel(ym)}</p>
          {filtersOn && (
            <button className="link-btn" onClick={() => { setTypeF('all'); setCatF([]); setQuery('') }}>
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        groups.map(({ date, txs, net }) => (
          <div className="day-group" key={date}>
            <div className="day-header">
              <span>{date === todayISO() ? `Aujourd’hui · ${formatDateLong(date)}` : formatDateLong(date)}</span>
              <span className={`day-total ${net >= 0 ? 'income' : 'expense'}`}>
                {net >= 0 ? '▲' : '▼'} {formatMoney(Math.abs(net), cur, 0)}
              </span>
            </div>
            <div className="list">
              {txs.map((t) => (
                <TxRow key={t.id} tx={t} onClick={() => open({ kind: 'transaction', tx: t })} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function todaySafe(): ISODate {
  return new Date().toISOString().slice(0, 10)
}
