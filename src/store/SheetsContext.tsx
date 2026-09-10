import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Budget, Category, Subscription, Transaction, Wallet } from '../types'
import { BudgetSheet } from '../sheets/BudgetSheet'
import { CategorySheet } from '../sheets/CategorySheet'
import { SubscriptionSheet } from '../sheets/SubscriptionSheet'
import { SubsListSheet } from '../sheets/SubsListSheet'
import { TransactionSheet } from '../sheets/TransactionSheet'
import { WalletSheet } from '../sheets/WalletSheet'

export type SheetState =
  | { kind: 'transaction'; tx?: Transaction; defaults?: Partial<Transaction> }
  | { kind: 'budget'; budget?: Budget }
  | { kind: 'wallet'; wallet?: Wallet }
  | { kind: 'subscription'; sub?: Subscription }
  | { kind: 'category'; category?: Category }
  | { kind: 'subs-list' }
  | null

interface SheetsValue {
  state: SheetState
  open: (s: SheetState) => void
  close: () => void
}

const SheetsCtx = createContext<SheetsValue | null>(null)

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SheetState>(null)
  const open = useCallback((s: SheetState) => setState(s), [])
  const close = useCallback(() => setState(null), [])
  const value = useMemo(() => ({ state, open, close }), [state, open, close])

  return (
    <SheetsCtx.Provider value={value}>
      {children}
      {state?.kind === 'transaction' && <TransactionSheet key={state.tx?.id ?? 'new'} state={state} />}
      {state?.kind === 'budget' && <BudgetSheet key={state.budget?.id ?? 'new'} state={state} />}
      {state?.kind === 'wallet' && <WalletSheet key={state.wallet?.id ?? 'new'} state={state} />}
      {state?.kind === 'subscription' && <SubscriptionSheet key={state.sub?.id ?? 'new'} state={state} />}
      {state?.kind === 'category' && <CategorySheet key={state.category?.id ?? 'new'} state={state} />}
      {state?.kind === 'subs-list' && <SubsListSheet />}
    </SheetsCtx.Provider>
  )
}

export function useSheets(): SheetsValue {
  const v = useContext(SheetsCtx)
  if (!v) throw new Error('useSheets doit être utilisé dans <SheetsProvider>')
  return v
}
