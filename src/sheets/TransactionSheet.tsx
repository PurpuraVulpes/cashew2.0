import { useState } from 'react'
import type { ISODate, Transaction, TransactionType } from '../types'
import { useStore } from '../store/StoreContext'
import { useSheets } from '../store/SheetsContext'
import type { SheetState } from '../store/SheetsContext'
import { categoryOf } from '../utils/calc'
import { currencySymbol, parseAmount } from '../utils/money'
import { todayISO } from '../utils/dates'
import { toast, uid } from '../utils/ui'
import { confirm } from '../components/Confirm'
import { Segmented, TextInput } from '../components/Controls'
import { Sheet } from '../components/Sheet'

type State = Extract<SheetState, { kind: 'transaction' }>

export function TransactionSheet({ state }: { state: State }) {
  const { data, saveTransaction, deleteTransaction } = useStore()
  const { close } = useSheets()
  const editing = state.tx

  const [type, setType] = useState<TransactionType>(editing?.type ?? state.defaults?.type ?? 'expense')
  const [amount, setAmount] = useState(
    editing ? String(editing.amount).replace('.', ',') : '',
  )
  const [title, setTitle] = useState(editing?.title ?? '')
  const [categoryId, setCategoryId] = useState<string>(
    editing?.categoryId ??
      state.defaults?.categoryId ??
      data.categories.find((c) => c.type === (editing?.type ?? state.defaults?.type ?? 'expense'))?.id ??
      '',
  )
  const [walletId, setWalletId] = useState(
    editing?.walletId ?? state.defaults?.walletId ?? data.wallets[0]?.id ?? '',
  )
  const [date, setDate] = useState<ISODate>(editing?.date ?? state.defaults?.date ?? todayISO())
  const [note, setNote] = useState(editing?.note ?? '')

  const cats = data.categories.filter((c) => c.type === type)
  const wallet = data.wallets.find((w) => w.id === walletId)
  const symbol = currencySymbol(wallet?.currency ?? data.settings.currency)

  const switchType = (t: TransactionType) => {
    setType(t)
    if (!cats.some((c) => c.id === categoryId)) {
      const first = data.categories.find((c) => c.type === t)
      if (first) setCategoryId(first.id)
    }
  }

  const save = () => {
    const parsed = parseAmount(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast('Entrez un montant valide')
      return
    }
    const cat = categoryOf(data, categoryId)
    const tx: Transaction = {
      id: editing?.id ?? uid(),
      title: title.trim() || cat?.name || 'Transaction',
      amount: parsed,
      categoryId,
      walletId,
      date,
      type,
      note: note.trim() || undefined,
      subscriptionId: editing?.subscriptionId,
    }
    saveTransaction(tx)
    toast(editing ? 'Transaction modifiée' : type === 'expense' ? 'Dépense ajoutée 🌰' : 'Revenu ajouté 🌰')
    close()
  }

  const remove = async () => {
    if (!editing) return
    const ok = await confirm({
      title: 'Supprimer la transaction ?',
      message: 'Cette action est définitive.',
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    deleteTransaction(editing.id)
    toast('Transaction supprimée')
    close()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={editing ? 'Modifier la transaction' : 'Nouvelle transaction'}
      footer={
        <div className="btn-row">
          {editing && (
            <button className="btn btn-danger-ghost" onClick={remove}>
              Supprimer
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
      <Segmented
        value={type}
        onChange={switchType}
        options={[
          { value: 'expense', label: '↓ Dépense' },
          { value: 'income', label: '↑ Revenu' },
        ]}
      />

      <div className="amount-field">
        <input
          className="amount-input"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Montant"
        />
        <span className="amount-symbol">{symbol}</span>
      </div>

      <TextInput
        placeholder={categoryOf(data, categoryId)?.name ?? 'Titre'}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={60}
        aria-label="Titre"
      />

      <div className="field">
        <span className="field-label">Catégorie</span>
        <div className="cat-grid">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cat-cell ${c.id === categoryId ? 'active' : ''}`}
              onClick={() => setCategoryId(c.id)}
            >
              <span className="cat-cell-emoji" style={{ background: c.color }}>
                {c.emoji}
              </span>
              <span className="cat-cell-name">{c.name}</span>
            </button>
          ))}
        </div>
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

      <div className="field-row">
        <div className="field" style={{ flex: 1 }}>
          <span className="field-label">Date</span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <span className="field-label">Note (optionnel)</span>
          <TextInput
            placeholder="Ex. courses de la semaine"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={80}
          />
        </div>
      </div>
    </Sheet>
  )
}
