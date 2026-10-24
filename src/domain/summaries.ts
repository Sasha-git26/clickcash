import type { Currency, Expense } from '../types/expense'

export interface CurrencyTotals {
  currency: Currency
  today: number
  thisMonth: number
  cash: number
  credit: number
  all: number
  count: number
}

/**
 * סיכומים מפוצלים לפי מטבע.
 *
 * אין כאן סכום-על מאוחד במתכוון: חיבור ₪, € ו-$ לסכום אחד דורש המרת מטבע
 * אמיתית שאינה קיימת בגרסה זו, והצגת מספר כזה הייתה מטעה.
 */
export function summarizeByCurrency(expenses: Expense[], now: Date = new Date()): CurrencyTotals[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()

  const byCurrency = new Map<Currency, CurrencyTotals>()

  for (const expense of expenses) {
    const timestamp = Date.parse(expense.dateTime)
    if (Number.isNaN(timestamp)) continue

    let totals = byCurrency.get(expense.currency)
    if (!totals) {
      totals = {
        currency: expense.currency,
        today: 0,
        thisMonth: 0,
        cash: 0,
        credit: 0,
        all: 0,
        count: 0,
      }
      byCurrency.set(expense.currency, totals)
    }

    totals.all += expense.amountMinor
    totals.count += 1
    if (expense.paymentMethod === 'cash') totals.cash += expense.amountMinor
    else totals.credit += expense.amountMinor
    if (timestamp >= startOfToday && timestamp < startOfTomorrow) totals.today += expense.amountMinor
    if (timestamp >= startOfMonth && timestamp < startOfNextMonth) {
      totals.thisMonth += expense.amountMinor
    }
  }

  // סדר יציב: המטבע עם ההוצאה הגבוהה ביותר ראשון, ושובר שוויון לפי קוד המטבע.
  return [...byCurrency.values()].sort(
    (a, b) => b.all - a.all || a.currency.localeCompare(b.currency),
  )
}
