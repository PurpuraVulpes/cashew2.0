import { useStore } from '../store/StoreContext'
import { useSheets } from '../store/SheetsContext'
import { monthlyEquivalent, sortedSubs } from '../utils/calc'
import { convert, formatMoney } from '../utils/money'
import { toast } from '../utils/ui'
import { Sheet } from '../components/Sheet'
import { SubRow } from '../components/SubRow'

export function SubsListSheet() {
  const { data, paySubscription } = useStore()
  const { close, open } = useSheets()
  const subs = sortedSubs(data)
  const monthly = subs.reduce(
    (s, sub) => s + convert(monthlyEquivalent(sub), data.wallets.find((w) => w.id === sub.walletId)?.currency ?? 'EUR', data.settings.currency),
    0,
  )

  return (
    <Sheet
      open
      onClose={close}
      title="Abonnements"
      footer={
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={close}>
            Fermer
          </button>
          <button className="btn btn-primary" onClick={() => open({ kind: 'subscription' })}>
            + Nouvel abonnement
          </button>
        </div>
      }
    >
      {subs.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji">🔁</span>
          <p>Aucun abonnement pour l’instant.</p>
          <p className="muted">Suivez Netflix, votre forfait, la salle de sport…</p>
        </div>
      ) : (
        <>
          <div className="subs-total">
            <span>Coût mensuel équivalent</span>
            <strong>{formatMoney(monthly, data.settings.currency)}</strong>
          </div>
          <div className="list">
            {subs.map((sub) => (
              <SubRow
                key={sub.id}
                sub={sub}
                onEdit={() => open({ kind: 'subscription', sub })}
                onPay={() => {
                  paySubscription(sub.id)
                  toast(`${sub.title} payé ✓`)
                }}
              />
            ))}
          </div>
        </>
      )}
    </Sheet>
  )
}
