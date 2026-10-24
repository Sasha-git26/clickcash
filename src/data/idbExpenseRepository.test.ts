import { beforeEach, describe, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { IdbExpenseRepository } from './idbExpenseRepository'
import { resetDbConnection } from './db'
import { makeExpense, makeInput } from '../test/factories'

let repository: IdbExpenseRepository

beforeEach(() => {
  // מסד נקי לכל מקרה בדיקה, כדי שהבדיקות לא יזלגו אחת לשנייה.
  globalThis.indexedDB = new IDBFactory()
  resetDbConnection()
  repository = new IdbExpenseRepository()
})

describe('IdbExpenseRepository', () => {
  it('מתחיל ריק', async () => {
    await expect(repository.list()).resolves.toEqual([])
  })

  it('מוסיף הוצאה עם מזהה וחתימות זמן', async () => {
    const created = await repository.add(makeInput())

    expect(created.id).toBeTruthy()
    expect(created.createdAt).toBeTruthy()
    expect(created.updatedAt).toBe(created.createdAt)
    expect(created.syncStatus).toBe('local')
    expect(created.amountMinor).toBe(2550)
  })

  it('שומר את ההוצאה גם לאחר פתיחה מחדש של החיבור למסד', async () => {
    const created = await repository.add(makeInput({ merchant: 'מסעדה' }))

    // סימולציה של סגירת הדפדפן ופתיחתו מחדש: חיבור חדש לאותו מסד.
    resetDbConnection()
    const reopened = new IdbExpenseRepository()

    const loaded = await reopened.list()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(created.id)
    expect(loaded[0].merchant).toBe('מסעדה')
  })

  it('לא שומר שדות אשראי בהוצאת מזומן', async () => {
    const created = await repository.add(
      makeInput({ paymentMethod: 'cash', cardLast4: '1234', installmentsCount: 6 }),
    )

    expect(created.cardLast4).toBeUndefined()
    expect(created.installmentsCount).toBe(1)
    expect('cardLast4' in created).toBe(false)
  })

  it('שומר שדות אשראי בהוצאת אשראי', async () => {
    const created = await repository.add(
      makeInput({ paymentMethod: 'credit', cardLast4: '4321', installmentsCount: 12 }),
    )

    expect(created.cardLast4).toBe('4321')
    expect(created.installmentsCount).toBe(12)
  })

  it('מחזיר את ההוצאות מהחדשה לישנה', async () => {
    await repository.add(makeInput({ dateTime: '2026-10-20T10:00:00+03:00' }))
    await repository.add(makeInput({ dateTime: '2026-10-23T10:00:00+03:00' }))
    await repository.add(makeInput({ dateTime: '2026-10-21T10:00:00+03:00' }))

    const dates = (await repository.list()).map((expense) => expense.dateTime.slice(0, 10))
    expect(dates).toEqual(['2026-10-23', '2026-10-21', '2026-10-20'])
  })

  it('מעדכן הוצאה קיימת ושומר על createdAt', async () => {
    const created = await repository.add(makeInput())
    const updated = await repository.update(created.id, {
      amountMinor: 9900,
      merchant: 'סונול',
    })

    expect(updated.id).toBe(created.id)
    expect(updated.amountMinor).toBe(9900)
    expect(updated.merchant).toBe('סונול')
    expect(updated.createdAt).toBe(created.createdAt)
    await expect(repository.get(created.id)).resolves.toMatchObject({ amountMinor: 9900 })
  })

  it('מנקה את שדות האשראי כשעוברים מאשראי למזומן', async () => {
    const created = await repository.add(
      makeInput({ paymentMethod: 'credit', cardLast4: '4321', installmentsCount: 12 }),
    )
    const updated = await repository.update(created.id, { paymentMethod: 'cash' })

    expect(updated.cardLast4).toBeUndefined()
    expect(updated.installmentsCount).toBe(1)
  })

  it('מקצץ רווחים בשם החנות ומשמיט פירוט ריק', async () => {
    const created = await repository.add(makeInput({ merchant: '  רמי לוי  ', description: '  ' }))

    expect(created.merchant).toBe('רמי לוי')
    expect('description' in created).toBe(false)
  })

  it('מאפשר לנקות את הפירוט בעריכה', async () => {
    const created = await repository.add(makeInput({ description: 'דלק 95' }))

    const cleared = await repository.update(created.id, { description: undefined })
    expect(cleared.description).toBeUndefined()
    expect((await repository.get(created.id))?.description).toBeUndefined()
    // שם החנות נשאר על כנו.
    expect((await repository.get(created.id))?.merchant).toBe('פז')
  })

  it('שומר על הפירוט בעדכון שאינו נוגע בו', async () => {
    const created = await repository.add(makeInput({ description: 'דלק 95' }))
    const updated = await repository.update(created.id, { amountMinor: 7700 })

    expect(updated.description).toBe('דלק 95')
    expect(updated.amountMinor).toBe(7700)
  })

  it('זורק שגיאה בעדכון הוצאה שאינה קיימת', async () => {
    await expect(repository.update('no-such-id', { amountMinor: 1 })).rejects.toThrow()
  })

  it('מוחק הוצאה', async () => {
    const created = await repository.add(makeInput())
    await repository.remove(created.id)

    await expect(repository.get(created.id)).resolves.toBeUndefined()
    await expect(repository.list()).resolves.toEqual([])
  })

  it('מחליף את כל הנתונים בשחזור מגיבוי', async () => {
    await repository.add(makeInput({ merchant: 'ישן' }))
    await repository.replaceAll([makeExpense({ id: 'r1' }), makeExpense({ id: 'r2' })])

    const loaded = await repository.list()
    expect(loaded.map((expense) => expense.id).sort()).toEqual(['r1', 'r2'])
  })
})
