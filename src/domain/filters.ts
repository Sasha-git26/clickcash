import type { Currency, Expense, PaymentMethod } from '../types/expense'

export type SortField = 'dateTime' | 'amount'
export type SortDirection = 'asc' | 'desc'

export interface ExpenseFilters {
  search: string
  from: string
  to: string
  currency: Currency | 'all'
  paymentMethod: PaymentMethod | 'all'
  sortField: SortField
  sortDirection: SortDirection
}

export const DEFAULT_FILTERS: ExpenseFilters = {
  search: '',
  from: '',
  to: '',
  currency: 'all',
  paymentMethod: 'all',
  sortField: 'dateTime',
  sortDirection: 'desc',
}

export function hasActiveFilters(filters: ExpenseFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.from !== '' ||
    filters.to !== '' ||
    filters.currency !== 'all' ||
    filters.paymentMethod !== 'all'
  )
}

/** תחילת היום המקומי עבור תאריך בפורמט yyyy-mm-dd. */
function startOfLocalDay(isoDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime()
}

const DAY_MS = 24 * 60 * 60 * 1000

export function applyFilters(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const search = filters.search.trim().toLocaleLowerCase()
  const fromTime = filters.from === '' ? null : startOfLocalDay(filters.from)
  const toStart = filters.to === '' ? null : startOfLocalDay(filters.to)
  // טווח התאריכים כולל את יום ה"עד" במלואו.
  const toTime = toStart === null ? null : toStart + DAY_MS

  const filtered = expenses.filter((expense) => {
    if (search !== '') {
      // החיפוש מכסה גם את שם החנות וגם את הפירוט.
      const haystack = `${expense.merchant}\n${expense.description ?? ''}`.toLocaleLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (filters.currency !== 'all' && expense.currency !== filters.currency) return false
    if (filters.paymentMethod !== 'all' && expense.paymentMethod !== filters.paymentMethod) {
      return false
    }

    if (fromTime !== null || toTime !== null) {
      const timestamp = Date.parse(expense.dateTime)
      if (Number.isNaN(timestamp)) return false
      if (fromTime !== null && timestamp < fromTime) return false
      if (toTime !== null && timestamp >= toTime) return false
    }

    return true
  })

  const direction = filters.sortDirection === 'asc' ? 1 : -1

  return filtered.sort((a, b) => {
    const primary =
      filters.sortField === 'amount'
        ? a.amountMinor - b.amountMinor
        : Date.parse(a.dateTime) - Date.parse(b.dateTime)
    // שובר שוויון לפי createdAt ואז id, כדי שהסדר יישאר יציב בין רינדורים.
    if (primary !== 0) return primary * direction
    const secondary = Date.parse(a.createdAt) - Date.parse(b.createdAt)
    if (secondary !== 0) return secondary * direction
    return a.id.localeCompare(b.id) * direction
  })
}

/**
 * ערכים שהוזנו בעבר בשדה מסוים, מסודרים לפי שכיחות ואז לפי שימוש אחרון —
 * הבסיס להשלמה האוטומטית בשדות הפירוט ושם החנות.
 */
function collectSuggestions(
  expenses: Expense[],
  pick: (expense: Expense) => string | undefined,
  limit: number,
): string[] {
  const stats = new Map<string, { label: string; count: number; lastUsed: number }>()

  for (const expense of expenses) {
    const label = pick(expense)?.trim() ?? ''
    if (label === '') continue
    const key = label.toLocaleLowerCase()
    const timestamp = Date.parse(expense.dateTime) || 0
    const existing = stats.get(key)
    if (existing) {
      existing.count += 1
      if (timestamp > existing.lastUsed) {
        existing.lastUsed = timestamp
        existing.label = label
      }
    } else {
      stats.set(key, { label, count: 1, lastUsed: timestamp })
    }
  }

  return [...stats.values()]
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, limit)
    .map((entry) => entry.label)
}

export function collectMerchantSuggestions(expenses: Expense[], limit = 24): string[] {
  return collectSuggestions(expenses, (expense) => expense.merchant, limit)
}

export function collectDescriptionSuggestions(expenses: Expense[], limit = 24): string[] {
  return collectSuggestions(expenses, (expense) => expense.description, limit)
}
