import type { Expense } from '../types/expense'
import { minorToAmountInput } from './money'
import { parseRestoredExpense } from './validation'

export const BACKUP_VERSION = 1

export interface BackupFile {
  app: 'hotzaot'
  version: number
  exportedAt: string
  expenses: Expense[]
}

const CSV_COLUMNS = [
  'id',
  'dateTime',
  'merchant',
  'description',
  'amount',
  'currency',
  'paymentMethod',
  'cardLast4',
  'installmentsCount',
  'createdAt',
  'updatedAt',
] as const

function escapeCsvCell(value: string): string {
  // ציטוט תמיד: מפשט את הטיפול בפסיקים, מרכאות ושורות חדשות בפירוט.
  return `"${value.replace(/"/g, '""')}"`
}

/**
 * CSV עם BOM של UTF-8 — בלעדיו Excel בחלונות מציג עברית כג'יבריש.
 * הסכום נכתב כמספר עשרוני (ולא ביחידות משנה) כדי שיהיה קריא בגיליון.
 */
export function buildCsv(expenses: Expense[]): string {
  const rows = [CSV_COLUMNS.join(',')]

  for (const expense of expenses) {
    rows.push(
      [
        expense.id,
        expense.dateTime,
        expense.merchant,
        expense.description ?? '',
        minorToAmountInput(expense.amountMinor),
        expense.currency,
        expense.paymentMethod,
        expense.cardLast4 ?? '',
        String(expense.installmentsCount),
        expense.createdAt,
        expense.updatedAt,
      ]
        .map(escapeCsvCell)
        .join(','),
    )
  }

  return `﻿${rows.join('\r\n')}\r\n`
}

export function buildBackup(expenses: Expense[], now: Date = new Date()): BackupFile {
  return {
    app: 'hotzaot',
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    expenses,
  }
}

export interface ParsedBackup {
  expenses: Expense[]
  /** רשומות שנפסלו בוולידציה ולא ייובאו. */
  skipped: number
}

/**
 * מפרש תוכן של קובץ גיבוי. מקבל גם מערך JSON "עירום" של הוצאות,
 * וגם את מבנה ה-BackupFile המלא.
 * מחזיר null אם לא ניתן לזהות מבנה תקין בכלל.
 */
export function parseBackup(fileContents: string): ParsedBackup | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(fileContents)
  } catch {
    return null
  }

  let rawExpenses: unknown
  if (Array.isArray(parsed)) {
    rawExpenses = parsed
  } else if (typeof parsed === 'object' && parsed !== null) {
    rawExpenses = (parsed as Record<string, unknown>).expenses
  }

  if (!Array.isArray(rawExpenses)) return null

  const expenses: Expense[] = []
  let skipped = 0
  const seenIds = new Set<string>()

  for (const raw of rawExpenses) {
    const expense = parseRestoredExpense(raw)
    if (!expense || seenIds.has(expense.id)) {
      skipped += 1
      continue
    }
    seenIds.add(expense.id)
    expenses.push(expense)
  }

  return { expenses, skipped }
}

/** מוריד תוכן טקסטואלי כקובץ. ב-iOS סאפארי פותח את גלריית ההורדות/שיתוף. */
export function downloadTextFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // שחרור ה-URL נדחה כדי שההורדה תתחיל לפני שהמשאב מתבטל.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function backupFilename(extension: 'csv' | 'json', now: Date = new Date()): string {
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
  return `hotzaot-${stamp}.${extension}`
}
