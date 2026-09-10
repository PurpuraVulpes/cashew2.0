import { useState } from 'react'
import type { Category, TransactionType } from '../types'
import { CATEGORY_COLORS } from '../data/categories'
import { useStore } from '../store/StoreContext'
import { useSheets } from '../store/SheetsContext'
import type { SheetState } from '../store/SheetsContext'
import { toast, uid } from '../utils/ui'
import { confirm } from '../components/Confirm'
import { ColorSwatches, EmojiPicker, Field, Segmented, TextInput } from '../components/Controls'
import { Sheet } from '../components/Sheet'

type State = Extract<SheetState, { kind: 'category' }>

export function CategorySheet({ state }: { state: State }) {
  const { data, saveCategory, deleteCategory } = useStore()
  const { close } = useSheets()
  const editing = state.category
  const used = data.transactions.some((t) => t.categoryId === editing?.id)

  const [name, setName] = useState(editing?.name ?? '')
  const [emoji, setEmoji] = useState(editing?.emoji ?? '🏷️')
  const [color, setColor] = useState(editing?.color ?? CATEGORY_COLORS[3])
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense')

  const save = () => {
    if (!name.trim()) {
      toast('Donnez un nom à la catégorie')
      return
    }
    saveCategory({ id: editing?.id ?? uid(), name: name.trim(), emoji, color, type, custom: editing?.custom })
    toast(editing ? 'Catégorie mise à jour' : 'Catégorie créée')
    close()
  }

  const remove = async () => {
    if (!editing) return
    const ok = await confirm({
      title: `Supprimer « ${editing.name} » ?`,
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    const done = deleteCategory(editing.id)
    if (!done) toast('Impossible : des transactions utilisent cette catégorie')
    else toast('Catégorie supprimée')
    if (done) close()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
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
      <TextInput placeholder="Nom de la catégorie" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
      <Field label="Couleur">
        <ColorSwatches colors={CATEGORY_COLORS} value={color} onChange={setColor} />
      </Field>
      <Field label="Type">
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'expense', label: 'Dépense' },
            { value: 'income', label: 'Revenu' },
          ]}
        />
      </Field>
      {editing && !editing.custom && (
        <p className="field-hint centered muted">Catégorie par défaut — personnalisable, mais non supprimable si utilisée.</p>
      )}
    </Sheet>
  )
}

