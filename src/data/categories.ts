import type { Category, TransactionType } from '../types'

// ─── Catégories par défaut ───────────────────────────────────────────────────

interface CatDef {
  name: string
  emoji: string
  color: string
}

export const DEFAULT_EXPENSE_CATEGORIES: CatDef[] = [
  { name: 'Alimentation', emoji: '🍔', color: '#e57348' },
  { name: 'Courses', emoji: '🛒', color: '#4caf7d' },
  { name: 'Restaurant', emoji: '🍽️', color: '#e88c51' },
  { name: 'Café', emoji: '☕', color: '#a5714f' },
  { name: 'Transports', emoji: '🚗', color: '#5b9bd5' },
  { name: 'Logement', emoji: '🏠', color: '#8e6fe8' },
  { name: 'Énergie', emoji: '💡', color: '#d9a928' },
  { name: 'Abonnements', emoji: '📺', color: '#e0645c' },
  { name: 'Loisirs', emoji: '🎮', color: '#9b7ede' },
  { name: 'Santé', emoji: '💊', color: '#4fa8a0' },
  { name: 'Shopping', emoji: '🛍️', color: '#e07a9b' },
  { name: 'Voyages', emoji: '✈️', color: '#42a5f5' },
  { name: 'Cadeaux', emoji: '🎁', color: '#ef6f91' },
  { name: 'Autres', emoji: '📦', color: '#8a9186' },
]

export const DEFAULT_INCOME_CATEGORIES: CatDef[] = [
  { name: 'Salaire', emoji: '💼', color: '#58a65c' },
  { name: 'Freelance', emoji: '💻', color: '#5b9bd5' },
  { name: 'Ventes', emoji: '🏷️', color: '#4fa8a0' },
  { name: 'Remboursements', emoji: '💸', color: '#7fb069' },
  { name: 'Investissements', emoji: '📈', color: '#e8965a' },
]

let catSeq = 0
function mkCat(def: CatDef, type: TransactionType): Category {
  catSeq += 1
  return { id: `cat-${catSeq}`, name: def.name, emoji: def.emoji, color: def.color, type }
}

export function defaultCategories(): Category[] {
  catSeq = 0
  return [
    ...DEFAULT_EXPENSE_CATEGORIES.map((d) => mkCat(d, 'expense')),
    ...DEFAULT_INCOME_CATEGORIES.map((d) => mkCat(d, 'income')),
  ]
}

export const EMOJI_PALETTE = [
  '🍔','🍕','🥐','☕','🛒','🍽️','🚗','🚌','⛽','🏠','💡','📱','📺','🎧','🎮','🎬',
  '💊','🏥','🛍️','👕','✈️','🏖️','🎁','💰','💼','💻','📚','🏋️','⚽','🐶','☁️','🔧',
  '🌰','🎯','💸','🏦','🚲','🎓','🎨','🧾','🍿','🍰','🍺','🥗','🚀','⭐','❤️','🧢',
]

export const WALLET_COLORS = ['#58a65c', '#5b9bd5', '#e8965a', '#9b7ede', '#e0645c', '#4fa8a0', '#e07a9b', '#7e8ce5', '#8a9186']

export const CATEGORY_COLORS = [
  '#e57348', '#e88c51', '#d9a928', '#4caf7d', '#58a65c', '#4fa8a0',
  '#5b9bd5', '#42a5f5', '#7e8ce5', '#9b7ede', '#8e6fe8', '#e07a9b',
  '#ef6f91', '#e0645c', '#a5714f', '#8a9186',
]
