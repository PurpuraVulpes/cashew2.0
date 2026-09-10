// ─── Devises gérées (taux indicatifs, pivot EUR) ─────────────────────────────

export interface CurrencyDef {
  code: string
  name: string
  /** 1 EUR = rate */
  rate: number
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'EUR', name: 'Euro', rate: 1 },
  { code: 'USD', name: 'Dollar américain', rate: 1.09 },
  { code: 'CHF', name: 'Franc suisse', rate: 0.94 },
  { code: 'GBP', name: 'Livre sterling', rate: 0.85 },
  { code: 'CAD', name: 'Dollar canadien', rate: 1.48 },
  { code: 'MAD', name: 'Dirham marocain', rate: 10.85 },
  { code: 'TND', name: 'Dinar tunisien', rate: 3.38 },
  { code: 'XOF', name: 'Franc CFA (BCEAO)', rate: 655.96 },
  { code: 'JPY', name: 'Yen', rate: 162 },
  { code: 'CNY', name: 'Yuan renminbi', rate: 7.85 },
  { code: 'BRL', name: 'Réal brésilien', rate: 5.95 },
  { code: 'INR', name: 'Roupie indienne', rate: 91 },
  { code: 'AUD', name: 'Dollar australien', rate: 1.64 },
  { code: 'SEK', name: 'Couronne suédoise', rate: 11.25 },
  { code: 'PLN', name: 'Złoty', rate: 4.28 },
]

export const RATES: Record<string, number> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.rate]),
)

export function currencyName(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.name ?? code
}
