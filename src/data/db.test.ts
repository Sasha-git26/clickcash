import { beforeEach, describe, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { DB_NAME, EXPENSES_STORE, getDb, resetDbConnection } from './db'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  resetDbConnection()
})

/**
 * יוצר מסד בסכמת v1 המקורית — לפני ש-merchant נולד — ושותל בו רשומה ישנה
 * שבה הטקסט היחיד הוא הפירוט.
 */
async function seedVersion1(): Promise<void> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(database) {
      const store = database.createObjectStore(EXPENSES_STORE, { keyPath: 'id' })
      store.createIndex('by-dateTime', 'dateTime')
      store.createIndex('by-description', 'description')
      store.createIndex('by-currency', 'currency')
      store.createIndex('by-paymentMethod', 'paymentMethod')
    },
  })

  await db.put(EXPENSES_STORE, {
    id: 'legacy-1',
    amountMinor: 2550,
    currency: 'ILS',
    description: 'פז',
    paymentMethod: 'cash',
    installmentsCount: 1,
    dateTime: '2026-03-15T08:30:00+02:00',
    createdAt: '2026-03-15T08:30:00+02:00',
    updatedAt: '2026-03-15T08:30:00+02:00',
    syncStatus: 'local',
  })
  db.close()
}

describe('שדרוג סכמת המסד', () => {
  it('יוצר את האינדקסים של הסכמה במסד חדש', async () => {
    const db = await getDb()

    expect([...db.transaction(EXPENSES_STORE).store.indexNames].sort()).toEqual([
      'by-currency',
      'by-dateTime',
      'by-description',
      'by-merchant',
      'by-paymentMethod',
    ])
  })

  it('מוסיף את by-merchant גם במסד שכבר היה ב-v1', async () => {
    await seedVersion1()
    resetDbConnection()

    const db = await getDb()

    // בלי זה התקנה מעודכנת והתקנה חדשה מגיעות לאותה גרסה עם אינדקסים שונים.
    expect(db.transaction(EXPENSES_STORE).store.indexNames.contains('by-merchant')).toBe(true)
    await expect(db.getAllFromIndex(EXPENSES_STORE, 'by-merchant', 'פז')).resolves.toHaveLength(1)
  })

  it('מעביר את הפירוט של רשומה ישנה לשם החנות', async () => {
    await seedVersion1()
    resetDbConnection()

    const migrated = await (await getDb()).get(EXPENSES_STORE, 'legacy-1')

    expect(migrated?.merchant).toBe('פז')
    expect(migrated?.description).toBeUndefined()
  })
})
