import type { Subscription } from '../types'
import { useStore } from '../store/StoreContext'
import { categoryOf, frequencyLabel, isDue, walletOf } from '../utils/calc'
import { dueLabel } from '../utils/dates'
import { formatMoney } from '../utils/money'

/** Ligne d'abonnement avec échéance et bouton Payer. */
export function SubRow({
  sub,
  onEdit,
  onPay,
}: {
  sub: Subscription
  onEdit?: () => void
  onPay?: () => void
}) {
  const { data } = useStore()
  const cat = categoryOf(data, sub.categoryId)
  const wallet = walletOf(data, sub.walletId)
  const info = dueLabel(sub.nextDue)
  const due = isDue(sub)

  return (
    <div className="sub-row">
      <button className="sub-left" onClick={onEdit} type="button" aria-label={`Modifier ${sub.title}`}>
        <div className="cat-icon" style={{ background: cat?.color ?? '#8a9186', fontSize: 20 }}>
          <span>{sub.emoji}</span>
        </div>
        <div className="tx-main">
          <span className="tx-title">{sub.title}</span>
          <span className="sub-freq">
            {frequencyLabel(sub)} · {formatMoney(sub.amount, wallet?.currency ?? data.settings.currency)}
          </span>
        </div>
      </button>
      <div className="sub-right">
        <span className={`due-chip tone-${info.tone}`}>{info.text}</span>
        {due && onPay && (
          <button className="btn btn-primary btn-xs" onClick={onPay} type="button">
            Payer
          </button>
        )}
      </div>
    </div>
  )
}
