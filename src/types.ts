// ─── Modèles de données de Cashew 2.0 ────────────────────────────────────────

export type TransactionType = 'expense' | 'income'
/** Date au format ISO « yyyy-mm-dd » (heure locale implicite) */
export type ISODate = string
/** Mois au format « yyyy-mm » */
export type YM = string

export interface Wallet {
  id: string
  name: string
  color: string
  /** Code devise ISO (EUR, USD…) */
  currency: string
  /** Solde initial, dans la devise du portefeuille */
  initialBalance: number
}

export interface Category {
  id: string
  name: string
  emoji: string
  color: string
  type: TransactionType
  /** true = créée par l'utilisateur (supprimable) */
  custom?: boolean
}

export interface Transaction {
  id: string
  title: string
  /** Montant strictement positif, dans la devise du portefeuille */
  amount: number
  categoryId: string
  walletId: string
  date: ISODate
  type: TransactionType
  note?: string
  /** Présent si la transaction provient d'un abonnement */
  subscriptionId?: string
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom'

export interface Budget {
  id: string
  name: string
  emoji: string
  /** Montant limite par période, dans la devise principale */
  amount: number
  period: BudgetPeriod
  /** Début de la première période */
  start: ISODate
  /** Fin (uniquement pour period === 'custom') */
  end?: ISODate
  /** null = toutes les catégories de dépenses */
  categoryIds: string[] | null
}

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Subscription {
  id: string
  title: string
  emoji: string
  amount: number
  walletId: string
  categoryId: string
  frequency: FrequencyType
  /** Tous les N (mois, semaines…) */
  interval: number
  /** Prochaine échéance */
  nextDue: ISODate
  /** Débiter automatiquement à l'ouverture de l'app */
  autoPay: boolean
  note?: string
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Settings {
  theme: ThemeMode
  /** Identifiant de la couleur d'accentuation */
  accent: string
  /** Devise principale (celle des totaux) */
  currency: string
}

export interface AppData {
  version: number
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  subscriptions: Subscription[]
  settings: Settings
}
