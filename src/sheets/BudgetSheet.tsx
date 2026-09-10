import { useState } from 'react'
import type { Budget, BudgetPeriod } from '../types'
import { useStore } from '../store/StoreContext'
import { useSheets } from '../store/SheetsContext'
import type { SheetState } from '../store/SheetsContext'
import { currencySymbol, parseAmount } from '../utils/money'
import { todayISO } from '../utils/dates'
import { toast, uid } from '../utils/ui'
import { confirm } from '../components/Confirm'
import { EmojiPicker, Field, Segmented, TextInput } from '../components/Controls'
import { Sheet } from '../components/Sheet'

type State = Extract<SheetState, { kind: 'budget' }>

export function BudgetSheet({ state }: { state: State }) {
  const { data, saveBudget, deleteBudget } = useStore()
  const { close, open } = useSheets()
  const editing = state.budget
  const cur = data.settings.currency

  const [name, setName] = useState(editing?.name ?? '')
  const [emoji, setEmoji] = useState(editing?.emoji ?? '🎯')
  const [amount, setAmount] = useState(editing ? String(editing.amount).replace('.', ',') : '')
  const [period, setPeriod] = useState<BudgetPeriod>(editing?.period ?? 'monthly')
  const [start, setStart] = useState(editing?.start ?? `${todayISO().slice(0, 7)}-01`)
  const [end, setEnd] = useState(editing?.end ?? todayISO())
  const [categoryIds, setCategoryIds] = useState<string[] | null>(editing?.categoryIds ?? null)

  const expenseCats = data.categories.filter((c) => c.type === 'expense')

  const toggleCat = (id: string) => {
    setCategoryIds((prev) => {
      const base = prev ?? []
      const next = base.includes(id) ? base.filter((c) => c !== id) : [...base, id]
      return next
    })
  }

  const save = () => {
    const parsed = parseAmount(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast('Entrez un montant valide')
      return
    }
    if (categoryIds !== null && categoryIds.length === 0) {
      toast('Choisissez au moins une catégorie, ou « Toutes »')
      return
    }
    if (period === 'custom' && end < start) {
      toast('La fin doit être après le début')
      return
    }
    const b: Budget = {
      id: editing?.id ?? uid(),
      name: name.trim() || 'Budget',
      emoji,
      amount: parsed,
      period,
      start,
      end: period === 'custom' ? end : undefined,
      categoryIds,
    }
    saveBudget(b)
    toast(editing ? 'Budget mis à jour 🎯' : 'Budget créé 🎯')
    close()
  }

  const remove = async () => {
    if (!editing) return
    const ok = await confirm({
      title: `Supprimer « ${editing.name} » ?`,
      message: 'Les transactions ne sont pas affectées.',
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    deleteBudget(editing.id)
    toast('Budget supprimé')
    close()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={editing ? 'Modifier le budget' : 'Nouveau budget'}
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
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <TextInput placeholder="Nom du budget (ex. Courses)" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />

      <div className="amount-field">
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Montant limite"
        />
        <span className="amount-symbol">{currencySymbol(cur)}</span>
      </div>

      <Field label="Périodicité">
        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'weekly', label: 'Hebdo' },
            { value: 'monthly', label: 'Mensuel' },
            { value: 'yearly', label: 'Annuel' },
            { value: 'custom', label: 'Libre' },
          ]}
        />
      </Field>

      <div className="field-row">
        <Field label={period === 'custom' ? 'Début' : 'Début de la 1ʳᵉ période'}>
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        {period === 'custom' && (
          <Field label="Fin">
            <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        )}
      </div>

      <div className="field">
        <span className="field-label">Catégories suivies</span>
        <div className="chips">
          <button
            type="button"
            className={`chip ${categoryIds === null ? 'active' : ''}`}
            onClick={() => setCategoryIds(null)}
          >
            🌰 Toutes
          </button>
          {expenseCats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${categoryIds?.includes(c.id) ? 'active' : ''}`}
              onClick={() => toggleCat(c.id)}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {!editing && (
        <button type="button" className="link-hint" onClick={() => { close(); open({ kind: 'subs-list' }) }}>
          Gérer les abonnements récurrents →
        </button>
      )}
    </Sheet>
  )
}
