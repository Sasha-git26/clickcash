import { EXPENSES_STORE, getDb } from './db'
import type { ExpenseRepository } from './ExpenseRepository'
import type { Expense, ExpenseInput } from '../types/expense'
import { toLocalIsoString } from '../domain/datetime'

function newId(): string {
  // crypto.randomUUID זמין בכל דפדפן מודרני בהקשר מאובטח (HTTPS / localhost).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * מנרמל קלט לפני כתיבה:
 * - במזומן אין משמעות לשדות האשראי, ולכן הם לא נשמרים כלל
 *   ולא יכולים "לדלוף" מרשומה קודמת.
 * - שדות אופציונליים ריקים מושמטים לגמרי במקום להישמר כמחרוזת ריקה.
 */
function normalizeInput(input: ExpenseInput): ExpenseInput {
  const normalized: ExpenseInput = {
    amountMinor: input.amountMinor,
    currency: input.currency,
    merchant: input.merchant.trim(),
    paymentMethod: input.paymentMethod,
    installmentsCount: input.paymentMethod === 'cash' ? 1 : input.installmentsCount,
    dateTime: input.dateTime,
  }

  const description = input.description?.trim()
  if (description) normalized.description = description

  if (input.paymentMethod === 'credit' && input.cardLast4) {
    normalized.cardLast4 = input.cardLast4
  }

  return normalized
}

export class IdbExpenseRepository implements ExpenseRepository {
  async list(): Promise<Expense[]> {
    const db = await getDb()
    const all = await db.getAll(EXPENSES_STORE)
    return all.sort(
      (a, b) =>
        Date.parse(b.dateTime) - Date.parse(a.dateTime) ||
        Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )
  }

  async get(id: string): Promise<Expense | undefined> {
    const db = await getDb()
    return db.get(EXPENSES_STORE, id)
  }

  async add(input: ExpenseInput): Promise<Expense> {
    const db = await getDb()
    const now = toLocalIsoString(new Date())
    const expense: Expense = {
      id: newId(),
      ...normalizeInput(input),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    }
    await db.put(EXPENSES_STORE, expense)
    return expense
  }

  async update(id: string, patch: Partial<ExpenseInput>): Promise<Expense> {
    const db = await getDb()
    const tx = db.transaction(EXPENSES_STORE, 'readwrite')
    const existing = await tx.store.get(id)
    if (!existing) {
      await tx.done
      throw new Error(`Expense not found: ${id}`)
    }

    const merged: ExpenseInput = {
      amountMinor: patch.amountMinor ?? existing.amountMinor,
      currency: patch.currency ?? existing.currency,
      merchant: patch.merchant ?? existing.merchant,
      paymentMethod: patch.paymentMethod ?? existing.paymentMethod,
      installmentsCount: patch.installmentsCount ?? existing.installmentsCount,
      dateTime: patch.dateTime ?? existing.dateTime,
    }
    // שדה אופציונלי שנכלל ב-patch עם undefined נחשב "ניקוי מכוון",
    // ולכן אסור ליפול בחזרה לערך הקיים.
    const nextCardLast4 = 'cardLast4' in patch ? patch.cardLast4 : existing.cardLast4
    if (nextCardLast4 !== undefined) merged.cardLast4 = nextCardLast4

    const nextDescription = 'description' in patch ? patch.description : existing.description
    if (nextDescription !== undefined) merged.description = nextDescription

    const updated: Expense = {
      id: existing.id,
      ...normalizeInput(merged),
      createdAt: existing.createdAt,
      updatedAt: toLocalIsoString(new Date()),
      // רשומה שסונכרנה בעבר תסומן כממתינה לעדכון כשיתווסף Backend.
      syncStatus: existing.syncStatus === 'synced' ? 'pendingUpdate' : existing.syncStatus,
    }
    if (existing.serverId) updated.serverId = existing.serverId

    await tx.store.put(updated)
    await tx.done
    return updated
  }

  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(EXPENSES_STORE, id)
  }

  async replaceAll(expenses: Expense[]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(EXPENSES_STORE, 'readwrite')
    await tx.store.clear()
    for (const expense of expenses) {
      await tx.store.put(expense)
    }
    await tx.done
  }
}

export const expenseRepository: ExpenseRepository = new IdbExpenseRepository()
