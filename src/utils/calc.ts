import type { AppData, Budget, Category, ISODate, Subscription, Transaction, YM } from '../types'
import { convert } from './money'
import {
  addDays,
  addMonthsISO,
  addYearsISO,
  dayOfMonth,
  daysInMonth,
  diffDays,
  endOfYear,
  monthRange,
  prevMonthEnd,
  startOfWeek,
  startOfYear,
  todayISO,
  ymOf,
} from './dates'

// ─── Portefeuilles & soldes ──────────────────────────────────────────────────

export function walletOf(data: AppData, id: string) {
  return data.wallets.find((w) => w.id === id)
}

export function walletCurrency(data: AppData, walletId: string): string {
  return walletOf(data, walletId)?.currency ?? data.settings.currency
}

export function categoryOf(data: AppData, id: string): Category | undefined {
  return data.categories.find((c) => c.id === id)
}

/** Convertit un montant de transaction vers la devise principale. */
export function txToMain(data: AppData, t: Transaction): number {
  return convert(t.amount, walletCurrency(data, t.walletId), data.settings.currency)
}

export function sumTxs(data: AppData, txs: Transaction[], type: Transaction['type']): number {
  let s = 0
  for (const t of txs) if (t.type === type) s += txToMain(data, t)
  return s
}

/** Solde d'un portefeuille (dans SA devise), jusqu'à une date incluse. */
export function walletBalance(data: AppData, walletId: string, upTo?: ISODate): number {
  const w = walletOf(data, walletId)
  if (!w) return 0
  let bal = w.initialBalance
  for (const t of data.transactions) {
    if (t.walletId !== walletId) continue
    if (upTo && t.date > upTo) continue
    bal += t.type === 'income' ? t.amount : -t.amount
  }
  return bal
}

/** Solde total converti dans la devise principale. */
export function totalBalance(data: AppData, upTo?: ISODate): number {
  let bal = 0
  for (const w of data.wallets) {
    bal += convert(walletBalance(data, w.id, upTo), w.currency, data.settings.currency)
  }
  return bal
}

/** Série jour par jour du solde total sur un mois (devise principale). */
export function balanceSeries(data: AppData, ym: YM): { x: number; y: number }[] {
  const { start, end } = monthRange(ym)
  const dim = daysInMonth(ym)
  const today = todayISO()
  const lastDay = ym === ymOf(today) ? Math.max(dayOfMonth(today), 1) : dim

  let bal = totalBalance(data, prevMonthEnd(ym))
  const byDay = new Map<number, number>()
  for (const t of data.transactions) {
    if (t.date < start || t.date > end) continue
    const d = dayOfMonth(t.date)
    const v = txToMain(data, t)
    byDay.set(d, (byDay.get(d) ?? 0) + (t.type === 'income' ? v : -v))
  }
  const points: { x: number; y: number }[] = []
  for (let d = 1; d <= lastDay; d++) {
    bal += byDay.get(d) ?? 0
    points.push({ x: d, y: Math.round(bal * 100) / 100 })
  }
  return points
}

// ─── Transactions ────────────────────────────────────────────────────────────

export function monthTxs(data: AppData, ym: YM): Transaction[] {
  const { start, end } = monthRange(ym)
  return data.transactions.filter((t) => t.date >= start && t.date <= end)
}

export function sortTxDesc(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1))
}

export function minMonth(data: AppData): YM {
  let min = ymOf(todayISO())
  for (const t of data.transactions) {
    const y = ymOf(t.date)
    if (y < min) min = y
  }
  return min
}

export function spendByCategory(data: AppData, txs: Transaction[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of txs) {
    if (t.type !== 'expense') continue
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + txToMain(data, t))
  }
  return map
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

export interface BudgetPeriodBounds {
  start: ISODate
  end: ISODate
  /** true si la période en cours contient aujourd'hui */
  active: boolean
}

/** Bornes de la période courante d'un budget. */
export function budgetPeriod(b: Budget, ref: ISODate = todayISO()): BudgetPeriodBounds {
  switch (b.period) {
    case 'weekly':
      return { start: startOfWeek(ref), end: startOfWeek(ref), active: true }
    case 'yearly':
      return { start: startOfYear(ref), end: endOfYear(ref), active: true }
    case 'custom': {
      const end = b.end ?? b.start
      return { start: b.start, end, active: ref >= b.start && ref <= end }
    }
    case 'monthly':
    default: {
      const ym = ymOf(ref)
      const { start, end } = monthRange(ym)
      return { start, end, active: true }
    }
  }
}

export function budgetSpent(data: AppData, b: Budget, bounds: BudgetPeriodBounds): number {
  const catIds = b.categoryIds
  let s = 0
  for (const t of data.transactions) {
    if (t.type !== 'expense') continue
    if (t.date < bounds.start || t.date > bounds.end) continue
    if (catIds && !catIds.includes(t.categoryId)) continue
    s += txToMain(data, t)
  }
  return s
}

export interface BudgetProgress {
  spent: number
  limit: number
  ratio: number
  remaining: number
  /** Jours restants dans la période (0 si terminée) */
  daysLeft: number
  daysTotal: number
  periodStart: ISODate
  periodEnd: ISODate
  active: boolean
  started: boolean
}

export function budgetProgress(data: AppData, b: Budget, ref: ISODate = todayISO()): BudgetProgress {
  const bounds = budgetPeriod(b, ref)
  const spent = budgetSpent(data, b, bounds)
  const daysTotal = diffDays(bounds.end, bounds.start) + 1
  const daysLeft = Math.max(diffDays(bounds.end, ref), 0)
  return {
    spent,
    limit: b.amount,
    ratio: b.amount > 0 ? spent / b.amount : 0,
    remaining: b.amount - spent,
    daysLeft,
    daysTotal,
    periodStart: bounds.start,
    periodEnd: bounds.end,
    active: bounds.active,
    started: ref >= bounds.start,
  }
}

/** Le budget « global » : aucune catégorie cochée. */
export function overallBudget(data: AppData): Budget | undefined {
  return data.budgets.find((b) => b.categoryIds === null)
}

export function periodLabel(b: Budget): string {
  switch (b.period) {
    case 'weekly':
      return 'Hebdomadaire'
    case 'yearly':
      return 'Annuel'
    case 'custom':
      return 'Personnalisé'
    default:
      return 'Mensuel'
  }
}

// ─── Abonnements ─────────────────────────────────────────────────────────────

/** Prochaine échéance après `from` (exclu). */
export function advanceDue(sub: Subscription, from: ISODate): ISODate {
  const n = Math.max(sub.interval, 1)
  switch (sub.frequency) {
    case 'daily':
      return addDays(from, n)
    case 'weekly':
      return addDays(from, 7 * n)
    case 'yearly':
      return addYearsISO(from, n)
    case 'monthly':
    default:
      return addMonthsISO(from, n)
  }
}

export function isDue(sub: Subscription, ref: ISODate = todayISO()): boolean {
  return sub.nextDue <= ref
}

export function sortedSubs(data: AppData): Subscription[] {
  return [...data.subscriptions].sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1))
}

/** Fréquence lisible : « Tous les 3 mois ». */
export function frequencyLabel(sub: Subscription): string {
  const unit =
    sub.frequency === 'daily'
      ? 'jour'
      : sub.frequency === 'weekly'
        ? 'semaine'
        : sub.frequency === 'yearly'
          ? 'an'
          : 'mois'
  const n = Math.max(sub.interval, 1)
  const plural = n > 1 ? (unit === 'mois' || unit === 'jour' ? 's' : '') : ''
  return n === 1 ? `Chaque ${unit}` : `Tous les ${n} ${unit}${plural}`
}

/** Montant mensuel équivalent (devise du portefeuille). */
export function monthlyEquivalent(sub: Subscription): number {
  const n = Math.max(sub.interval, 1)
  const k =
    sub.frequency === 'daily'
      ? 30.44 / n
      : sub.frequency === 'weekly'
        ? 4.348 / n
        : sub.frequency === 'yearly'
          ? 1 / 12 / n
          : 1 / n
  return sub.amount * k
}
