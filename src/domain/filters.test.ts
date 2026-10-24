import { describe, expect, it } from 'vitest'
import {
  applyFilters,
  collectDescriptionSuggestions,
  collectMerchantSuggestions,
  DEFAULT_FILTERS,
  hasActiveFilters,
} from './filters'
import { makeExpense } from '../test/factories'

const expenses = [
  makeExpense({
    id: 'a',
    merchant: 'ארומה',
    description: 'קפה',
    amountMinor: 1200,
    currency: 'ILS',
    dateTime: '2026-10-20T08:00:00+03:00',
  }),
  makeExpense({
    id: 'b',
    merchant: 'רמי לוי',
    description: 'סופרמרקט',
    amountMinor: 24000,
    currency: 'ILS',
    paymentMethod: 'credit',
    cardLast4: '1234',
    installmentsCount: 6,
    dateTime: '2026-10-22T19:30:00+03:00',
  }),
  makeExpense({
    id: 'c',
    merchant: 'Starbucks',
    amountMinor: 3500,
    currency: 'USD',
    dateTime: '2026-10-23T07:15:00+03:00',
  }),
]

describe('applyFilters', () => {
  it('ברירת המחדל מחזירה את הכל, מהחדש לישן', () => {
    expect(applyFilters(expenses, DEFAULT_FILTERS).map((e) => e.id)).toEqual(['c', 'b', 'a'])
  })

  it('מחפש בשם החנות ללא תלות ברישיות', () => {
    expect(
      applyFilters(expenses, { ...DEFAULT_FILTERS, search: 'starbucks' }).map((e) => e.id),
    ).toEqual(['c'])
    expect(applyFilters(expenses, { ...DEFAULT_FILTERS, search: 'רמי' }).map((e) => e.id)).toEqual([
      'b',
    ])
  })

  it('מחפש גם בפירוט', () => {
    expect(applyFilters(expenses, { ...DEFAULT_FILTERS, search: 'קפה' }).map((e) => e.id)).toEqual([
      'a',
    ])
  })

  it('לא נופל על הוצאה ללא פירוט', () => {
    expect(
      applyFilters(expenses, { ...DEFAULT_FILTERS, search: 'סופרמרקט' }).map((e) => e.id),
    ).toEqual(['b'])
  })

  it('מסנן לפי מטבע ולפי אמצעי תשלום', () => {
    expect(
      applyFilters(expenses, { ...DEFAULT_FILTERS, currency: 'USD' }).map((e) => e.id),
    ).toEqual(['c'])
    expect(
      applyFilters(expenses, { ...DEFAULT_FILTERS, paymentMethod: 'credit' }).map((e) => e.id),
    ).toEqual(['b'])
  })

  it('טווח התאריכים כולל את יום ה"עד" במלואו', () => {
    const result = applyFilters(expenses, {
      ...DEFAULT_FILTERS,
      from: '2026-10-22',
      to: '2026-10-22',
    })
    expect(result.map((e) => e.id)).toEqual(['b'])
  })

  it('ממיין לפי סכום בשני הכיוונים', () => {
    expect(
      applyFilters(expenses, { ...DEFAULT_FILTERS, sortField: 'amount' }).map((e) => e.id),
    ).toEqual(['b', 'c', 'a'])
    expect(
      applyFilters(expenses, {
        ...DEFAULT_FILTERS,
        sortField: 'amount',
        sortDirection: 'asc',
      }).map((e) => e.id),
    ).toEqual(['a', 'c', 'b'])
  })

  it('לא משנה את המערך המקורי', () => {
    const original = expenses.map((e) => e.id)
    applyFilters(expenses, { ...DEFAULT_FILTERS, sortField: 'amount' })
    expect(expenses.map((e) => e.id)).toEqual(original)
  })
})

describe('hasActiveFilters', () => {
  it('מזהה סינון פעיל', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: 'קפה' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, currency: 'USD' })).toBe(true)
    // שינוי מיון אינו "סינון" ולכן לא משנה את הודעת הרשימה הריקה.
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sortField: 'amount' })).toBe(false)
  })
})

describe('collectMerchantSuggestions', () => {
  it('מסדר חנויות לפי שכיחות', () => {
    const suggestions = collectMerchantSuggestions([
      makeExpense({ merchant: 'ארומה' }),
      makeExpense({ merchant: 'רמי לוי' }),
      makeExpense({ merchant: 'ארומה' }),
    ])
    expect(suggestions).toEqual(['ארומה', 'רמי לוי'])
  })

  it('מאחד שמות זהים בלי תלות ברישיות', () => {
    const suggestions = collectMerchantSuggestions([
      makeExpense({ merchant: 'Starbucks', dateTime: '2026-10-01T10:00:00+03:00' }),
      makeExpense({ merchant: 'starbucks', dateTime: '2026-10-05T10:00:00+03:00' }),
    ])
    // התצוגה היא של הגרסה שהוזנה לאחרונה.
    expect(suggestions).toEqual(['starbucks'])
  })

  it('מגביל את מספר ההצעות', () => {
    const many = Array.from({ length: 50 }, (_, index) =>
      makeExpense({ merchant: `חנות ${index}` }),
    )
    expect(collectMerchantSuggestions(many, 10)).toHaveLength(10)
  })
})

describe('collectDescriptionSuggestions', () => {
  it('אוסף פירוטים ומדלג על הוצאות ללא פירוט', () => {
    const suggestions = collectDescriptionSuggestions([
      makeExpense({ description: 'קפה' }),
      makeExpense({ merchant: 'פז' }),
      makeExpense({ description: 'קפה' }),
      makeExpense({ description: 'דלק' }),
    ])
    expect(suggestions).toEqual(['קפה', 'דלק'])
  })
})
