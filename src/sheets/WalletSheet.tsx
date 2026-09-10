import { useState } from 'react'
import type { Wallet } from '../types'
import { CURRENCIES } from '../data/currencies'
import { WALLET_COLORS } from '../data/categories'
import { useStore } from '../store/StoreContext'
import { useSheets } from '../store/SheetsContext'
import type { SheetState } from '../store/SheetsContext'
import { parseAmount } from '../utils/money'
import { toast, uid } from '../utils/ui'
import { confirm } from '../components/Confirm'
import { ColorSwatches, Field, Select, TextInput } from '../components/Controls'
import { Sheet } from '../components/Sheet'

type State = Extract<SheetState, { kind: 'wallet' }>

export function WalletSheet({ state }: { state: State }) {
  const { data, saveWallet, deleteWallet } = useStore()
  const { close } = useSheets()
  const editing = state.wallet

  const [name, setName] = useState(editing?.name ?? '')
  const [color, setColor] = useState(editing?.color ?? WALLET_COLORS[0])
  const [currency, setCurrency] = useState(editing?.currency ?? data.settings.currency)
  const [initialBalance, setInitialBalance] = useState(
    editing ? String(editing.initialBalance).replace('.', ',') : '0',
  )

  const save = () => {
    if (!name.trim()) {
      toast('Donnez un nom au portefeuille')
      return
    }
    const initial = parseAmount(initialBalance)
    if (!Number.isFinite(initial)) {
      toast('Solde initial invalide')
      return
    }
    saveWallet({
      id: editing?.id ?? uid(),
      name: name.trim(),
      color,
      currency,
      initialBalance: initial,
    })
    toast(editing ? 'Portefeuille mis à jour' : 'Portefeuille créé 👛')
    close()
  }

  const remove = async () => {
    if (!editing) return
    const ok = await confirm({
      title: `Supprimer « ${editing.name} » ?`,
      message: 'Toutes ses transactions et abonnements seront également supprimés.',
      confirmLabel: 'Tout supprimer',
      danger: true,
    })
    if (!ok) return
    deleteWallet(editing.id)
    toast('Portefeuille supprimé')
    close()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={editing ? 'Modifier le portefeuille' : 'Nouveau portefeuille'}
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
            {editing ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      }
    >
      <TextInput placeholder="Nom (ex. Compte courant)" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />

      <Field label="Couleur">
        <ColorSwatches colors={WALLET_COLORS} value={color} onChange={setColor} />
      </Field>

      <Field label="Devise">
        <Select
          value={currency}
          onChange={setCurrency}
          options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
        />
      </Field>

      <Field label="Solde initial" hint="Les totaux sont convertis dans votre devise principale.">
        <TextInput
          inputMode="decimal"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
        />
      </Field>
    </Sheet>
  )
}
