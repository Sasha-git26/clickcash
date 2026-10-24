import { describe, expect, it } from 'vitest'
import { parseRestoredExpense, validateExpenseForm } from './validation'
import { makeFormValues } from '../test/factories'

describe('validateExpenseForm', () => {
  it('מקבל הוצאה תקינה במזומן וחותם את השעה הנוכחית', () => {
    const now = new Date(2026, 9, 23, 14, 5, 0)
    const result = validateExpenseForm(makeFormValues(), { now })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.amountMinor).toBe(2550)
    expect(result.value.currency).toBe('ILS')
    expect(result.value.merchant).toBe('פז')
    expect(result.value.paymentMethod).toBe('cash')
    expect(result.value.installmentsCount).toBe(1)
    expect(result.value.cardLast4).toBeUndefined()
    expect(result.value.dateTime.startsWith('2026-10-23T14:05:00')).toBe(true)
  })

  it('דורש סכום ושם חנות', () => {
    const result = validateExpenseForm(makeFormValues({ amount: '', merchant: '  ' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.amount).toBe('amountRequired')
    expect(result.errors.merchant).toBe('merchantRequired')
  })

  it('פוסל סכום לא תקין', () => {
    const result = validateExpenseForm(makeFormValues({ amount: '12.345' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.amount).toBe('amountInvalid')
  })

  it('פוסל שם חנות ארוך מדי', () => {
    const result = validateExpenseForm(makeFormValues({ merchant: 'א'.repeat(61) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.merchant).toBe('merchantTooLong')
  })

  it('הפירוט אופציונלי ומושמט כשהוא ריק', () => {
    const empty = validateExpenseForm(makeFormValues({ description: '   ' }))
    expect(empty.ok).toBe(true)
    if (!empty.ok) return
    expect(empty.value.description).toBeUndefined()

    const filled = validateExpenseForm(makeFormValues({ description: '  דלק 95  ' }))
    expect(filled.ok).toBe(true)
    if (!filled.ok) return
    expect(filled.value.description).toBe('דלק 95')
  })

  it('פוסל פירוט ארוך מדי', () => {
    const result = validateExpenseForm(makeFormValues({ description: 'א'.repeat(81) }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.description).toBe('descriptionTooLong')
  })

  it('דורש בדיוק ארבע ספרות באשראי', () => {
    for (const cardLast4 of ['', '12', '12345', 'abcd']) {
      const result = validateExpenseForm(
        makeFormValues({ paymentMethod: 'credit', cardLast4, installmentsCount: 1 }),
      )
      expect(result.ok).toBe(false)
      if (result.ok) continue
      expect(result.errors.cardLast4).toBe('cardLast4Invalid')
    }
  })

  it('מגביל את מספר התשלומים לטווח 1 עד 36', () => {
    for (const installmentsCount of [0, 37, 1.5]) {
      const result = validateExpenseForm(
        makeFormValues({ paymentMethod: 'credit', cardLast4: '1234', installmentsCount }),
      )
      expect(result.ok).toBe(false)
      if (result.ok) continue
      expect(result.errors.installmentsCount).toBe('installmentsOutOfRange')
    }

    const valid = validateExpenseForm(
      makeFormValues({ paymentMethod: 'credit', cardLast4: '1234', installmentsCount: 36 }),
    )
    expect(valid.ok).toBe(true)
  })

  it('מתעלם משדות אשראי כשאמצעי התשלום הוא מזומן', () => {
    const result = validateExpenseForm(
      // ערכים שהיו נפסלים באשראי — במזומן הם פשוט לא נשמרים.
      makeFormValues({ paymentMethod: 'cash', cardLast4: '12', installmentsCount: 99 }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.cardLast4).toBeUndefined()
    expect(result.value.installmentsCount).toBe(1)
  })

  it('מתרגם תאריך ושעה מהטופס ל-ISO מקומי', () => {
    const result = validateExpenseForm(makeFormValues({ dateTime: '2026-03-15T08:30' }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.dateTime.startsWith('2026-03-15T08:30:00')).toBe(true)
  })

  it('פוסל תאריך בפורמט לא תקין', () => {
    const result = validateExpenseForm(makeFormValues({ dateTime: 'לא-תאריך' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.dateTime).toBe('dateTimeInvalid')
  })

  it('פוסל תאריך ריק כשהשדה גלוי, במקום לחתום מחדש על עכשיו', () => {
    const result = validateExpenseForm(makeFormValues({ dateTime: '' }), {
      dateTimeRequired: true,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.dateTime).toBe('dateTimeRequired')
  })
})

describe('parseRestoredExpense', () => {
  const valid = {
    id: 'abc',
    amountMinor: 1500,
    currency: 'USD',
    merchant: 'Starbucks',
    description: 'Coffee',
    paymentMethod: 'credit',
    cardLast4: '4321',
    installmentsCount: 3,
    dateTime: '2026-10-01T10:00:00+03:00',
    createdAt: '2026-10-01T10:00:00+03:00',
    updatedAt: '2026-10-01T10:00:00+03:00',
  }

  it('מקבל רשומה תקינה', () => {
    expect(parseRestoredExpense(valid)).toMatchObject({
      id: 'abc',
      amountMinor: 1500,
      currency: 'USD',
      merchant: 'Starbucks',
      description: 'Coffee',
      cardLast4: '4321',
      installmentsCount: 3,
      syncStatus: 'local',
    })
  })

  it('ממיר גם קובץ שבו הסכום נשמר כמספר עשרוני', () => {
    const { amountMinor: _unused, ...withoutMinor } = valid
    expect(parseRestoredExpense({ ...withoutMinor, amount: 15 })?.amountMinor).toBe(1500)
  })

  it('מעלה את הפירוט לשם החנות בקובץ גיבוי ישן שאין בו שם חנות', () => {
    const { merchant: _unused, ...withoutMerchant } = valid
    const restored = parseRestoredExpense(withoutMerchant)

    expect(restored?.merchant).toBe('Coffee')
    expect(restored?.description).toBeUndefined()
  })

  it('משמיט פירוט ריק', () => {
    expect(parseRestoredExpense({ ...valid, description: '   ' })?.description).toBeUndefined()
    const { description: _unused, ...withoutDescription } = valid
    expect(parseRestoredExpense(withoutDescription)?.description).toBeUndefined()
  })

  it('פוסל רשומות עם שדות חסרים או לא תקינים', () => {
    expect(parseRestoredExpense(null)).toBeNull()
    expect(parseRestoredExpense({ ...valid, id: '' })).toBeNull()
    expect(parseRestoredExpense({ ...valid, currency: 'GBP' })).toBeNull()
    expect(parseRestoredExpense({ ...valid, amountMinor: 0 })).toBeNull()
    expect(parseRestoredExpense({ ...valid, dateTime: 'nope' })).toBeNull()
    // ללא שם חנות וללא פירוט אין ממה לבנות רשומה.
    expect(parseRestoredExpense({ ...valid, merchant: '  ', description: '' })).toBeNull()
  })

  it('מנרמל שדות אשראי שאינם תקינים במקום לפסול את הרשומה', () => {
    const restored = parseRestoredExpense({ ...valid, cardLast4: '12', installmentsCount: 99 })
    expect(restored?.cardLast4).toBeUndefined()
    expect(restored?.installmentsCount).toBe(1)
  })
})
