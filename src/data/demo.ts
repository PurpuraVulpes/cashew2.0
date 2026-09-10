import type { AppData, ISODate, Subscription, Transaction } from '../types'
import { defaultCategories } from './categories'
import { addDays, dayOfMonth, parseISO, todayISO } from '../utils/dates'
import { mulberry32, uid } from '../utils/ui'

// ─── Données de démonstration (4 mois, en euros) ─────────────────────────────

export function buildDemoData(): AppData {
  const rand = mulberry32(20260910)
  const today = todayISO()
  const cats = defaultCategories()
  const cat = (name: string) => cats.find((c) => c.name === name)!.id

  const wallets = [
    { id: 'w-main', name: 'Compte courant', color: '#58a65c', currency: 'EUR', initialBalance: 1250 },
    { id: 'w-cash', name: 'Espèces', color: '#e8965a', currency: 'EUR', initialBalance: 60 },
    { id: 'w-save', name: 'Épargne', color: '#5b9bd5', currency: 'EUR', initialBalance: 3500 },
  ]

  const transactions: Transaction[] = []
  const push = (
    date: ISODate,
    title: string,
    amount: number,
    categoryId: string,
    walletId: string,
    type: Transaction['type'] = 'expense',
    extra: Partial<Transaction> = {},
  ) => {
    transactions.push({
      id: uid(),
      title,
      amount: Math.round(amount * 100) / 100,
      categoryId,
      walletId,
      date,
      type,
      ...extra,
    })
  }

  const flt = (min: number, max: number) => min + rand() * (max - min)

  // Balayage jour par jour sur ~4 mois
  let cur = addDays(today, -120)
  let sinceFuel = 6
  while (cur <= today) {
    const iso: string = cur
    const dom = dayOfMonth(iso)
    const dow = parseISO(iso).getDay()

    // Revenus & charges fixes
    if (dom === 27) push(iso, 'Salaire', 2450, cat('Salaire'), 'w-main', 'income')
    if (dom === 3) push(iso, 'Loyer', 820, cat('Logement'), 'w-main')
    if (dom === 5) push(iso, 'Forfait mobile', 19.99, cat('Abonnements'), 'w-main', 'expense', { subscriptionId: 's-mobile' })
    if (dom === 8) push(iso, 'Netflix', 13.49, cat('Abonnements'), 'w-main', 'expense', { subscriptionId: 's-netflix' })
    if (dom === 12) push(iso, 'Spotify', 10.99, cat('Abonnements'), 'w-main', 'expense', { subscriptionId: 's-spotify' })
    if (dom === 15) push(iso, 'EDF — Électricité', flt(48, 64), cat('Énergie'), 'w-main')
    if (dom === 20) push(iso, 'iCloud+', 2.99, cat('Abonnements'), 'w-main', 'expense', { subscriptionId: 's-icloud' })
    if (dom === 15) push(iso, 'Salle de sport', 29.99, cat('Loisirs'), 'w-main', 'expense', { subscriptionId: 's-gym' })
    if (dom === 10 && rand() < 0.4) push(iso, 'Mission freelance', flt(280, 620), cat('Freelance'), 'w-main', 'income')
    if (dom === 18 && rand() < 0.5) push(iso, 'Remboursement Sécu', flt(12, 26), cat('Remboursements'), 'w-main', 'income')
    if (dom === 22 && rand() < 0.5) push(iso, 'Vente Vinted', flt(15, 42), cat('Ventes'), 'w-cash', 'income')

    // Hebdomadaire
    if (dow === 2) push(iso, rand() < 0.5 ? 'Carrefour' : 'Lidl', flt(42, 96), cat('Courses'), 'w-main')
    if (dow === 6) push(iso, 'Marché', flt(20, 55), cat('Courses'), 'w-cash')
    if (dow === 5 && rand() < 0.65) push(iso, rand() < 0.5 ? 'Le Petit Bistrot' : 'Pizzeria da Marco', flt(18, 56), cat('Restaurant'), 'w-main')
    if (dow === 0 && rand() < 0.3) push(iso, 'Brunch', flt(14, 30), cat('Restaurant'), 'w-main')

    // Quotidien aléatoire
    if (rand() < 0.35) push(iso, 'Boulangerie', flt(2.2, 6.5), cat('Alimentation'), 'w-cash')
    if (rand() < 0.12) push(iso, rand() < 0.5 ? 'Café Lucas' : 'Starbucks', flt(2.2, 5.2), cat('Café'), 'w-cash')
    if (rand() < 0.07) push(iso, 'Pharmacie', flt(8, 30), cat('Santé'), 'w-main')
    if (rand() < 0.045) push(iso, 'Cinéma', flt(9.8, 15), cat('Loisirs'), 'w-main')
    if (rand() < 0.04) push(iso, 'Steam', flt(9.99, 44.99), cat('Loisirs'), 'w-main')
    if (rand() < 0.03) push(iso, rand() < 0.5 ? 'Zara' : 'Décathlon', flt(29.9, 94.9), cat('Shopping'), 'w-main')
    if (rand() < 0.02) push(iso, 'Cadeau anniversaire', flt(20, 60), cat('Cadeaux'), 'w-main')

    // Essence tous les ~12 jours
    sinceFuel += 1
    if (sinceFuel >= 12 && dow >= 3) {
      push(iso, 'Station Total', flt(48, 68), cat('Transports'), 'w-main')
      sinceFuel = 0
    }

    cur = addDays(iso, 1)
  }

  const subscriptions: Subscription[] = [
    { id: 's-netflix', title: 'Netflix', emoji: '🍿', amount: 13.49, walletId: 'w-main', categoryId: cat('Abonnements'), frequency: 'monthly', interval: 1, nextDue: addDays(today, 2), autoPay: false },
    { id: 's-spotify', title: 'Spotify', emoji: '🎧', amount: 10.99, walletId: 'w-main', categoryId: cat('Abonnements'), frequency: 'monthly', interval: 1, nextDue: addDays(today, 5), autoPay: false },
    { id: 's-mobile', title: 'Forfait mobile', emoji: '📱', amount: 19.99, walletId: 'w-main', categoryId: cat('Abonnements'), frequency: 'monthly', interval: 1, nextDue: addDays(today, -1), autoPay: false, note: 'Forfait 200 Go' },
    { id: 's-icloud', title: 'iCloud+', emoji: '☁️', amount: 2.99, walletId: 'w-main', categoryId: cat('Abonnements'), frequency: 'monthly', interval: 1, nextDue: addDays(today, 9), autoPay: true },
    { id: 's-gym', title: 'Salle de sport', emoji: '🏋️', amount: 29.99, walletId: 'w-main', categoryId: cat('Loisirs'), frequency: 'monthly', interval: 1, nextDue: addDays(today, 12), autoPay: false },
    { id: 's-insurance', title: 'Assurance auto', emoji: '🚗', amount: 485, walletId: 'w-main', categoryId: cat('Transports'), frequency: 'yearly', interval: 1, nextDue: addDays(today, 41), autoPay: false },
  ]

  const budgets = [
    { id: 'b-all', name: 'Budget global', emoji: '🎯', amount: 2000, period: 'monthly' as const, start: `${today.slice(0, 7)}-01`, categoryIds: null },
    { id: 'b-groceries', name: 'Courses', emoji: '🛒', amount: 450, period: 'monthly' as const, start: `${today.slice(0, 7)}-01`, categoryIds: [cat('Courses')] },
    { id: 'b-restaurant', name: 'Restaurant', emoji: '🍽️', amount: 220, period: 'monthly' as const, start: `${today.slice(0, 7)}-01`, categoryIds: [cat('Restaurant')] },
    { id: 'b-food', name: 'Alimentation', emoji: '🍔', amount: 120, period: 'monthly' as const, start: `${today.slice(0, 7)}-01`, categoryIds: [cat('Alimentation')] },
    { id: 'b-transport', name: 'Transports', emoji: '🚗', amount: 160, period: 'monthly' as const, start: `${today.slice(0, 7)}-01`, categoryIds: [cat('Transports')] },
    { id: 'b-fun', name: 'Loisirs', emoji: '🎮', amount: 120, period: 'monthly' as const, start: `${today.slice(0, 7)}-01`, categoryIds: [cat('Loisirs')] },
    { id: 'b-shopping', name: 'Shopping', emoji: '🛍️', amount: 150, period: 'monthly' as const, start: `${today.slice(0, 7)}-01`, categoryIds: [cat('Shopping')] },
    { id: 'b-coffee', name: 'Café', emoji: '☕', amount: 40, period: 'monthly' as const, start: `${today.slice(0, 7)}-01`, categoryIds: [cat('Café')] },
  ]

  return {
    version: 1,
    wallets,
    categories: cats,
    transactions,
    budgets,
    subscriptions,
    settings: { theme: 'system', accent: 'green', currency: 'EUR' },
  }
}

export function emptyData(): AppData {
  return {
    version: 1,
    wallets: [
      { id: uid(), name: 'Compte principal', color: '#58a65c', currency: 'EUR', initialBalance: 0 },
    ],
    categories: defaultCategories(),
    transactions: [],
    budgets: [],
    subscriptions: [],
    settings: { theme: 'system', accent: 'green', currency: 'EUR' },
  }
}
