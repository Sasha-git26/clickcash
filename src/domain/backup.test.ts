import { describe, expect, it } from 'vitest'
import { backupFilename, buildBackup, buildCsv, parseBackup } from './backup'
import { makeExpense } from '../test/factories'

describe('buildCsv', () => {
  it('מתחיל ב-BOM של UTF-8 כדי שעברית תיקרא נכון באקסל', () => {
    expect(buildCsv([]).startsWith('﻿')).toBe(true)
  })

  it('כותב כותרת ושורה לכל הוצאה, עם סכום עשרוני קריא', () => {
    const csv = buildCsv([
      makeExpense({
        merchant: 'רמי לוי',
        description: 'סופרמרקט',
        amountMinor: 24000,
        paymentMethod: 'credit',
        cardLast4: '1234',
        installmentsCount: 6,
      }),
    ])
    const lines = csv.replace('﻿', '').trim().split('\r\n')

    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('amount')
    expect(lines[0]).toContain('merchant')
    expect(lines[1]).toContain('"סופרמרקט"')
    expect(lines[1]).toContain('"רמי לוי"')
    expect(lines[1]).toContain('"240.00"')
    expect(lines[1]).toContain('"1234"')
    expect(lines[1]).toContain('"6"')
  })

  it('מגן על פסיקים ומרכאות בטקסט חופשי', () => {
    const csv = buildCsv([makeExpense({ merchant: 'קפה, "ללכת"' })])
    expect(csv).toContain('"קפה, ""ללכת"""')
  })

  it('כותב פירוט ריק כשלא הוזן', () => {
    const csv = buildCsv([makeExpense({ merchant: 'פז' })])
    expect(csv).toContain('"פז",""')
  })
})

describe('parseBackup', () => {
  it('מפרש קובץ גיבוי מלא', () => {
    const backup = buildBackup([makeExpense({ id: 'x' }), makeExpense({ id: 'y' })])
    const parsed = parseBackup(JSON.stringify(backup))

    expect(parsed?.expenses.map((e) => e.id)).toEqual(['x', 'y'])
    expect(parsed?.skipped).toBe(0)
  })

  it('מפרש גם מערך JSON עירום של הוצאות', () => {
    const parsed = parseBackup(JSON.stringify([makeExpense({ id: 'z' })]))
    expect(parsed?.expenses.map((e) => e.id)).toEqual(['z'])
  })

  it('מדלג על רשומות פסולות ועל מזהים כפולים במקום להיכשל', () => {
    const valid = makeExpense({ id: 'ok' })
    const parsed = parseBackup(JSON.stringify([valid, { id: 'broken' }, valid]))

    expect(parsed?.expenses.map((e) => e.id)).toEqual(['ok'])
    expect(parsed?.skipped).toBe(2)
  })

  it('מחזיר null על JSON שבור או על מבנה לא מזוהה', () => {
    expect(parseBackup('{{{')).toBeNull()
    expect(parseBackup('{"hello":"world"}')).toBeNull()
  })
})

describe('backupFilename', () => {
  it('כולל את התאריך ואת הסיומת המבוקשת', () => {
    expect(backupFilename('csv', new Date(2026, 9, 5))).toBe('hotzaot-2026-10-05.csv')
    expect(backupFilename('json', new Date(2026, 9, 5))).toBe('hotzaot-2026-10-05.json')
  })
})
