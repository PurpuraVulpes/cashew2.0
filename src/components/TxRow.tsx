import type { Transaction } from '../types'
import { useStore } from '../store/StoreContext'
import { categoryOf, walletOf } from '../utils/calc'
import { formatMoney } from '../utils/money'
import { CategoryIcon } from './CategoryIcon'

/** Ligne de transaction : icône catégorie, titre, tags, montant. */
export function TxRow({ tx, onClick }: { tx: Transaction; onClick?: () => void }) {
  const { data } = useStore()
  const cat = categoryOf(data, tx.categoryId)
  const wallet = walletOf(data, tx.walletId)
  const expense = tx.type === 'expense'
  return (
    <button className="tx-row" onClick={onClick} type="button">
      <CategoryIcon cat={cat} repeat={!!tx.subscriptionId} />
      <div className="tx-main">
        <span className="tx-title">{tx.title}</span>
        <span className="tx-tags">
          {cat && <span className="tag">{cat.name}</span>}
          {wallet && <span className="tag">{wallet.name}</span>}
        </span>
      </div>
      <span className={`tx-amt ${expense ? 'expense' : 'income'}`}>
        <span className="tx-arrow" aria-hidden>
          {expense ? '▼' : '▲'}
        </span>
        {formatMoney(tx.amount, wallet?.currency ?? data.settings.currency)}
      </span>
    </button>
  )
}
