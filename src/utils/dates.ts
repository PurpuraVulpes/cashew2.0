import type { ISODate, YM } from '../types'

// Toutes les dates sont manipulées en heure locale via des ISO « yyyy-mm-dd ».

export function toISO(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function todayISO(): ISODate {
  return toISO(new Date())
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Ajoute n mois en bornant le jour (31/03 + 1 mois = 30/04). */
export function addMonthsISO(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, dim))
  return toISO(d)
}

export function addYearsISO(iso: ISODate, n: number): ISODate {
  const d = parseISO(iso)
  const day = d.getDate()
  d.setDate(1)
  d.setFullYear(d.getFullYear() + n)
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, dim))
  return toISO(d)
}

export function ymOf(iso: ISODate): YM {
  return iso.slice(0, 7)
}

export function currentYM(): YM {
  return ymOf(todayISO())
}

export function addMonthsYM(ym: YM, n: number): YM {
  return ymOf(addMonthsISO(`${ym}-01`, n))
}

export function monthRange(ym: YM): { start: ISODate; end: ISODate } {
  const [y, m] = ym.split('-').map(Number)
  const dim = new Date(y, m, 0).getDate()
  return { start: `${ym}-01`, end: `${ym}-${String(dim).padStart(2, '0')}` }
}

export function prevMonthEnd(ym: YM): ISODate {
  return addDays(`${ym}-01`, -1)
}

export function daysInMonth(ym: YM): number {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function dayOfMonth(iso: ISODate): number {
  return parseISO(iso).getDate()
}

/** Lundi de la semaine contenant iso. */
export function startOfWeek(iso: ISODate): ISODate {
  const d = parseISO(iso)
  const dow = (d.getDay() + 6) % 7
  return addDays(iso, -dow)
}

export function endOfWeek(iso: ISODate): ISODate {
  return addDays(startOfWeek(iso), 6)
}

export function startOfYear(iso: ISODate): ISODate {
  return `${iso.slice(0, 4)}-01-01`
}

export function endOfYear(iso: ISODate): ISODate {
  return `${iso.slice(0, 4)}-12-31`
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86_400_000)
}

const longFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const mediumFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const shortMonthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

/** « mardi 10 septembre » */
export function formatDateLong(iso: ISODate): string {
  return longFmt.format(parseISO(iso))
}

/** « 10 sept. 2026 » */
export function formatDateMedium(iso: ISODate): string {
  return mediumFmt.format(parseISO(iso))
}

/** « septembre 2026 » */
export function monthLabel(ym: YM): string {
  return monthFmt.format(parseISO(`${ym}-01`))
}

/** « sept. » */
export function shortMonthLabel(ym: YM): string {
  const s = shortMonthFmt.format(parseISO(`${ym}-01`))
  return s.replace('.', '')
}

export function todayLong(): string {
  return formatDateLong(todayISO())
}

export interface DueInfo {
  text: string
  tone: 'late' | 'today' | 'soon' | 'future'
}

export function dueLabel(iso: ISODate): DueInfo {
  const d = diffDays(iso, todayISO())
  if (d < 0) return { text: d === -1 ? 'En retard (hier)' : `En retard de ${-d} j`, tone: 'late' }
  if (d === 0) return { text: "Aujourd'hui", tone: 'today' }
  if (d === 1) return { text: 'Demain', tone: 'soon' }
  if (d <= 7) return { text: `Dans ${d} j`, tone: 'soon' }
  return { text: formatDateMedium(iso), tone: 'future' }
}
