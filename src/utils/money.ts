import { RATES } from '../data/currencies'

/** Conversion via le pivot EUR (taux indicatifs). */
export function convert(amount: number, from: string, to: string): number {
  if (from === to) return amount
  const f = RATES[from] ?? 1
  const t = RATES[to] ?? 1
  return (amount / f) * t
}

const symbolCache = new Map<string, string>()

export function currencySymbol(code: string): string {
  if (symbolCache.has(code)) return symbolCache.get(code)!
  let sym = code
  try {
    const parts = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(1)
    sym = parts.find((p) => p.type === 'currency')?.value ?? code
  } catch {
    sym = code
  }
  symbolCache.set(code, sym)
  return sym
}

/** Formate un montant : 1 234,56 € */
export function formatMoney(amount: number, currency: string, decimals = 2): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  } catch {
    return `${amount.toFixed(decimals).replace('.', ',')} ${currency}`
  }
}

/** Format compact pour les axes de graphiques : 1,2k € */
export function formatCompact(amount: number, currency: string): string {
  const sym = currencySymbol(currency)
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '−' : ''
  const fmt = (n: number, d: number) =>
    n.toFixed(d).replace('.', ',').replace(',000', '').replace(/,0$/, '')
  if (abs >= 1_000_000) return `${sign}${fmt(abs / 1_000_000, 1)} M${sym}`
  if (abs >= 10_000) return `${sign}${fmt(abs / 1_000, 0)} k${sym}`
  if (abs >= 1_000) return `${sign}${fmt(abs / 1_000, 1)} k${sym}`
  if (abs >= 100) return `${sign}${fmt(abs, 0)} ${sym}`
  return `${sign}${fmt(abs, abs % 1 === 0 ? 0 : 1)} ${sym}`
}

/** Analyse une saisie utilisateur (« 12,50 », « 1 200.40 »…). */
export function parseAmount(s: string): number {
  const cleaned = s.replace(/\s|\u00a0|\u202f/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : NaN
}
