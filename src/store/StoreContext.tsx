import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AppData,
  Budget,
  Category,
  ISODate,
  Settings,
  Subscription,
  Transaction,
  Wallet,
} from '../types'
import { buildDemoData, emptyData } from '../data/demo'
import { advanceDue, isDue } from '../utils/calc'
import { todayISO } from '../utils/dates'
import { uid } from '../utils/ui'

// ─── Persistance & hydratation ───────────────────────────────────────────────

const STORAGE_KEY = 'cashew2-data-v1'

/** Débite automatiquement les abonnements en retard marqués « autoPay ». */
function runAutoPay(data: AppData): AppData {
  const today = todayISO()
  let changed = false
  const subs = data.subscriptions.map((sub) => {
    if (!sub.autoPay || !isDue(sub, today)) return sub
    changed = true
    let next = sub.nextDue
    const created: Transaction[] = []
    let guard = 0
    while (next <= today && guard < 60) {
      created.push({
        id: uid(),
        title: sub.title,
        amount: sub.amount,
        categoryId: sub.categoryId,
        walletId: sub.walletId,
        date: next,
        type: 'expense',
        subscriptionId: sub.id,
      })
      next = advanceDue(sub, next)
      guard += 1
    }
    data.transactions.push(...created)
    return { ...sub, nextDue: next }
  })
  return changed ? { ...data, subscriptions: subs } : data
}

function sanitize(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Partial<AppData>
  if (!Array.isArray(d.wallets) || !Array.isArray(d.categories) || !Array.isArray(d.transactions)) return null
  if (!d.settings || typeof d.settings !== 'object') return null
  return {
    version: 1,
    wallets: d.wallets,
    categories: d.categories,
    transactions: d.transactions,
    budgets: Array.isArray(d.budgets) ? d.budgets : [],
    subscriptions: Array.isArray(d.subscriptions) ? d.subscriptions : [],
    settings: {
      theme: d.settings.theme ?? 'system',
      accent: d.settings.accent ?? 'green',
      currency: d.settings.currency ?? 'EUR',
    },
  }
}

function initData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = sanitize(JSON.parse(raw))
      if (parsed) return runAutoPay(parsed)
    }
  } catch {
    /* données corrompues → démo */
  }
  return buildDemoData()
}

// ─── API du store ────────────────────────────────────────────────────────────

export interface StoreValue {
  data: AppData
  saveTransaction: (tx: Transaction) => void
  deleteTransaction: (id: string) => void
  saveWallet: (w: Wallet) => void
  deleteWallet: (id: string) => void
  saveBudget: (b: Budget) => void
  deleteBudget: (id: string) => void
  saveSubscription: (s: Subscription) => void
  deleteSubscription: (id: string, withTransactions?: boolean) => void
  paySubscription: (id: string) => void
  saveCategory: (c: Category) => void
  deleteCategory: (id: string) => boolean
  setSettings: (patch: Partial<Settings>) => void
  loadDemo: () => void
  clearAll: () => void
  importData: (json: string) => boolean
  exportData: () => string
}

const StoreCtx = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initData)
  const dataRef = useRef(data)
  dataRef.current = data

  // Persistance automatique
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* quota dépassé — on ignore */
    }
  }, [data])

  const value = useMemo<StoreValue>(() => {
    const upsert = <T extends { id: string }>(list: T[], item: T): T[] => {
      const i = list.findIndex((x) => x.id === item.id)
      if (i === -1) return [...list, item]
      const copy = [...list]
      copy[i] = item
      return copy
    }

    return {
      data,
      saveTransaction: (tx) => setData((d) => ({ ...d, transactions: upsert(d.transactions, tx) })),
      deleteTransaction: (id) =>
        setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) })),

      saveWallet: (w) => setData((d) => ({ ...d, wallets: upsert(d.wallets, w) })),
      deleteWallet: (id) =>
        setData((d) => ({
          ...d,
          wallets: d.wallets.filter((w) => w.id !== id),
          transactions: d.transactions.filter((t) => t.walletId !== id),
          subscriptions: d.subscriptions.filter((s) => s.walletId !== id),
        })),

      saveBudget: (b) => setData((d) => ({ ...d, budgets: upsert(d.budgets, b) })),
      deleteBudget: (id) => setData((d) => ({ ...d, budgets: d.budgets.filter((b) => b.id !== id) })),

      saveSubscription: (s) => setData((d) => ({ ...d, subscriptions: upsert(d.subscriptions, s) })),
      deleteSubscription: (id, withTransactions = false) =>
        setData((d) => ({
          ...d,
          subscriptions: d.subscriptions.filter((s) => s.id !== id),
          transactions: withTransactions
            ? d.transactions.filter((t) => t.subscriptionId !== id)
            : d.transactions.map((t) => (t.subscriptionId === id ? { ...t, subscriptionId: undefined } : t)),
        })),
      paySubscription: (id) =>
        setData((d) => {
          const sub = d.subscriptions.find((s) => s.id === id)
          if (!sub) return d
          const today = todayISO() as ISODate
          const date = sub.nextDue <= today ? sub.nextDue : today
          const tx: Transaction = {
            id: uid(),
            title: sub.title,
            amount: sub.amount,
            categoryId: sub.categoryId,
            walletId: sub.walletId,
            date,
            type: 'expense',
            subscriptionId: sub.id,
          }
          const next = advanceDue(sub, sub.nextDue)
          return {
            ...d,
            transactions: [...d.transactions, tx],
            subscriptions: d.subscriptions.map((s) => (s.id === id ? { ...s, nextDue: next } : s)),
          }
        }),

      saveCategory: (c) => setData((d) => ({ ...d, categories: upsert(d.categories, c) })),
      deleteCategory: (id) => {
        const used = dataRef.current.transactions.some((t) => t.categoryId === id)
        if (used) return false
        setData((d) => ({
          ...d,
          categories: d.categories.filter((c) => c.id !== id),
          budgets: d.budgets.map((b) =>
            b.categoryIds ? { ...b, categoryIds: b.categoryIds.filter((c) => c !== id) } : b,
          ),
        }))
        return true
      },

      setSettings: (patch) =>
        setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      loadDemo: () => setData(buildDemoData()),
      clearAll: () => setData(emptyData()),
      importData: (json) => {
        try {
          const parsed = sanitize(JSON.parse(json))
          if (!parsed) return false
          setData(runAutoPay(parsed))
          return true
        } catch {
          return false
        }
      },
      exportData: () => JSON.stringify(dataRef.current, null, 2),
    }
  }, [data])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore(): StoreValue {
  const v = useContext(StoreCtx)
  if (!v) throw new Error('useStore doit être utilisé dans <StoreProvider>')
  return v
}
