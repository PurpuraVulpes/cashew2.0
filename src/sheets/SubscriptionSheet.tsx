import { useState } from 'react'
import type { FrequencyType, ISODate, Subscription } from '../types'
import { useStore } from '../store/StoreContext'
import { useSheets } from '../store/SheetsContext'
import type { SheetState } from '../store/SheetsContext'
import { categoryOf, frequencyLabel, isDue } from '../utils/calc'
import { currencySymbol, parseAmount } from '../utils/money'
import { todayISO } from '../utils/dates'
import { toast, uid } from '../utils/ui'
import { confirm } from '../components/Confirm'
import { EmojiPicker, Field, Segmented, TextInput } from '../components/Controls'
import { Sheet } from '../components/Sheet'

type State = Extract<SheetState, { kind: 'subscription' }>

export function SubscriptionSheet({ state }: { state: State }) {
  const { data, saveSubscription, deleteSubscription, paySubscription } = useStore()
  const { close } = useSheets()
  const editing = state.sub

  const [title, setTitle] = useState(editing?.title ?? '')
  const [emoji, setEmoji] = useState(editing?.emoji ?? '🔁')
  const [amount, setAmount] = useState(editing ? String(editing.amount).replace('.', ',') : '')
  const [walletId, setWalletId] = useState(editing?.walletId ?? data.wallets[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ??
      data.categories.find((c) => c.type === 'expense' && c.name === 'Abonnements')?.id ??
      data.categories.find((c) => c.type === 'expense')?.id ??
      '',
  )
  const [frequency, setFrequency] = useState<FrequencyType>(editing?.frequency ?? 'monthly')
  const [interval, setIntervalNum] = useState(editing?.interval ?? 1)
  const [nextDue, setNextDue] = useState<ISODate>(editing?.nextDue ?? todayISO())
  const [autoPay, setAutoPay] = useState(editing?.autoPay ?? false)

  const wallet = data.wallets.find((w) => w.id === walletId)
  const symbol = currencySymbol(wallet?.currency ?? data.settings.currency)
  const due = editing ? isDue(editing) : false

  const preview: Subscription = {
    id: 'x',
    title,
    emoji,
    amount: 0,
    walletId,
    categoryId,
    frequency,
    interval,
    nextDue,
    autoPay,
  }

  const save = () => {
    if (!title.trim()) {
      toast('Donnez un nom à l’abonnement')
      return
    }
    const parsed = parseAmount(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast('Entrez un montant valide')
      return
    }
    saveSubscription({
      id: editing?.id ?? uid(),
      title: title.trim(),
      emoji,
      amount: parsed,
      walletId,
      categoryId,
      frequency,
      interval: Math.min(Math.max(Math.round(interval) || 1, 1), 60),
      nextDue,
      autoPay,
    })
    toast(editing ? 'Abonnement mis à jour 🔁' : 'Abonnement ajouté 🔁')
    close()
  }

  const pay = () => {
    if (!editing) return
    paySubscription(editing.id)
    toast(`${editing.title} payé ✓`)
  }

  const remove = async () => {
    if (!editing) return
    const ok = await confirm({
      title: `Supprimer « ${editing.title} » ?`,
      message: 'Les transactions déjà enregistrées seront conservées.',
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    deleteSubscription(editing.id)
    toast('Abonnement supprimé')
    close()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={editing ? "Modifier l'abonnement" : 'Nouvel abonnement'}
      footer={
        <div className="btn-row">
          {editing && (
            <button className="btn btn-danger-ghost" onClick={remove}>
              Supprimer
            </button>
          )}
          {editing && due && (
            <button className="btn btn-pay" onClick={pay}>
              Payer
            </button>
          )}
          <button className="btn btn-ghost" onClick={close}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={save}>
            {editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      }
    >
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <TextInput placeholder="Nom (ex. Netflix)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />

      <div className="amount-field">
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Montant"
        />
        <span className="amount-symbol">{symbol}</span>
      </div>

      <div className="field">
        <span className="field-label">Portefeuille</span>
        <div className="chips">
          {data.wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`chip ${w.id === walletId ? 'active' : ''}`}
              onClick={() => setWalletId(w.id)}
            >
              <span className="chip-dot" style={{ background: w.color }} />
              {w.name}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Catégorie</span>
        <div className="chips">
          {data.categories
            .filter((c) => c.type === 'expense')
            .map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${c.id === categoryId ? 'active' : ''}`}
                onClick={() => setCategoryId(c.id)}
              >
                {c.emoji} {c.name}
              </button>
            ))}
        </div>
      </div>

      <Field label="Récurrence">
        <Segmented
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'daily', label: 'Jour' },
            { value: 'weekly', label: 'Semaine' },
            { value: 'monthly', label: 'Mois' },
            { value: 'yearly', label: 'An' },
          ]}
        />
      </Field>

      <div className="field-row">
        <Field label="Intervalle (tous les N)">
          <input
            className="input"
            type="number"
            min={1}
            max={60}
            value={interval}
            onChange={(e) => setIntervalNum(parseInt(e.target.value, 10) || 1)}
          />
        </Field>
        <Field label="Prochaine échéance">
          <input className="input" type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
        </Field>
      </div>

      <label className="switch-row">
        <span>
          Débit automatique
          <small>Crée la transaction dès l’échéance à l’ouverture de l’app</small>
        </span>
        <span className={`switch ${autoPay ? 'on' : ''}`}>
          <input type="checkbox" checked={autoPay} onChange={(e) => setAutoPay(e.target.checked)} />
        </span>
      </label>

      <p className="field-hint centered">
        {frequencyLabel(preview)} · prochaine échéance le {nextDue.split('-').reverse().join('/')}
      </p>
      <p className="field-hint centered muted">
        Sera classé dans « {categoryOf(data, categoryId)?.name ?? '—'} »
      </p>
    </Sheet>
  )
}
