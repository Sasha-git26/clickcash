import { describe, expect, it } from 'vitest'
import { summarizeByCurrency } from './summaries'
import { makeExpense } from '../test/factories'

const now = new Date(2026, 9, 23, 18, 0, 0)

describe('summarizeByCurrency', () => {
  it('מחזיר מערך ריק כשאין הוצאות', () => {
    expect(summarizeByCurrency([], now)).toEqual([])
  })

  it('מפצל סיכומים לפי מטבע ולא מחבר מטבעות שונים', () => {
    const totals = summarizeByCurrency(
      [
        makeExpense({ currency: 'ILS', amountMinor: 1000, dateTime: '2026-10-23T09:00:00+03:00' }),
        makeExpense({ currency: 'USD', amountMinor: 500, dateTime: '2026-10-23T10:00:00+03:00' }),
        makeExpense({ currency: 'EUR', amountMinor: 300, dateTime: '2026-10-23T11:00:00+03:00' }),
      ],
      now,
    )

    expect(totals).toHaveLength(3)
    expect(totals.map((group) => group.currency)).toEqual(['ILS', 'USD', 'EUR'])
    for (const group of totals) {
      expect(group.all).toBe(group.today)
    }
  })

  it('מפריד בין היום, החודש והוצאות מחודש קודם', () => {
    const [ils] = summarizeByCurrency(
      [
        makeExpense({ amountMinor: 1000, dateTime: '2026-10-23T09:00:00+03:00' }), // היום
        makeExpense({ amountMinor: 2000, dateTime: '2026-10-05T09:00:00+03:00' }), // החודש
        makeExpense({ amountMinor: 4000, dateTime: '2026-09-30T23:00:00+03:00' }), // חודש קודם
      ],
      now,
    )

    expect(ils.today).toBe(1000)
    expect(ils.thisMonth).toBe(3000)
    expect(ils.all).toBe(7000)
    expect(ils.count).toBe(3)
  })

  it('מפריד בין מזומן לאשראי', () => {
    const [ils] = summarizeByCurrency(
      [
        makeExpense({ amountMinor: 1000, paymentMethod: 'cash' }),
        makeExpense({ amountMinor: 2500, paymentMethod: 'credit', cardLast4: '1234' }),
        makeExpense({ amountMinor: 500, paymentMethod: 'credit', cardLast4: '1234' }),
      ],
      now,
    )

    expect(ils.cash).toBe(1000)
    expect(ils.credit).toBe(3000)
    expect(ils.cash + ils.credit).toBe(ils.all)
  })

  it('מתעלם מרשומות עם תאריך לא תקין', () => {
    const totals = summarizeByCurrency([makeExpense({ dateTime: 'not-a-date' })], now)
    expect(totals).toEqual([])
  })

  it('מסדר את המטבעות מהסכום הגבוה לנמוך', () => {
    const totals = summarizeByCurrency(
      [
        makeExpense({ currency: 'ILS', amountMinor: 100 }),
        makeExpense({ currency: 'USD', amountMinor: 900 }),
      ],
      now,
    )
    expect(totals.map((group) => group.currency)).toEqual(['USD', 'ILS'])
  })
})
