import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Expense } from '../types/expense'

export const DB_NAME = 'hotzaot-db'
export const DB_VERSION = 2
export const EXPENSES_STORE = 'expenses'

export interface HotzaotDB extends DBSchema {
  [EXPENSES_STORE]: {
    key: string
    value: Expense
    indexes: {
      'by-dateTime': string
      'by-description': string
      'by-merchant': string
      'by-currency': string
      'by-paymentMethod': string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<HotzaotDB>> | null = null

export function getDb(): Promise<IDBPDatabase<HotzaotDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HotzaotDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        // כל שדרוג סכמה עתידי מתווסף כאן כבלוק `if (oldVersion < n)` נוסף.
        if (oldVersion < 1) {
          const expenses = db.createObjectStore(EXPENSES_STORE, { keyPath: 'id' })
          expenses.createIndex('by-dateTime', 'dateTime')
          expenses.createIndex('by-description', 'description')
          expenses.createIndex('by-merchant', 'merchant')
          expenses.createIndex('by-currency', 'currency')
          expenses.createIndex('by-paymentMethod', 'paymentMethod')
        }

        // v2: שם החנות הפך לשדה החובה והפירוט לאופציונלי.
        // ברשומות ישנות הטקסט היחיד שהוזן הוא למעשה שם המקום, ולכן הוא מועבר לשם.
        if (oldVersion >= 1 && oldVersion < 2) {
          const store = tx.objectStore(EXPENSES_STORE)
          // merchant נולד ב-v2, ולכן מסד שכבר היה ב-v1 מגיע לכאן בלי האינדקס
          // שהסכמה מצהירה עליו. בלי השורה הזו התקנה מעודכנת והתקנה חדשה
          // מגיעות לאותה DB_VERSION עם אינדקסים שונים.
          if (!store.indexNames.contains('by-merchant')) {
            store.createIndex('by-merchant', 'merchant')
          }
          for await (const cursor of store) {
            const expense = cursor.value as Expense & { description?: string }
            if (expense.merchant) continue
            const { description, ...rest } = expense
            await cursor.update({ ...rest, merchant: description ?? '' })
          }
        }
      },
    })
  }
  return dbPromise
}

/** משמש בבדיקות כדי לקבל חיבור נקי בין מקרי בדיקה. */
export function resetDbConnection(): void {
  dbPromise = null
}
