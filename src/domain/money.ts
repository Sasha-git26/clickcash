import type { Currency } from '../types/expense'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ILS: '₪',
  EUR: '€',
  USD: '$',
}

/** כל שלושת המטבעות הנתמכים משתמשים בשתי ספרות עשרוניות. */
const MINOR_UNITS_PER_MAJOR = 100

/**
 * ממיר קלט משתמש לסכום ביחידות משנה שלמות.
 * מקבל נקודה או פסיק כמפריד עשרוני, ומתעלם ברווחים.
 * מחזיר null אם הקלט אינו סכום חוקי חיובי.
 */
export function parseAmountToMinor(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.')
  if (normalized === '') return null
  if (!/^\d*\.?\d*$/.test(normalized)) return null

  const [whole = '', fraction = ''] = normalized.split('.')
  if (whole === '' && fraction === '') return null
  if (fraction.length > 2) return null

  const minor =
    Number(whole || '0') * MINOR_UNITS_PER_MAJOR + Number(fraction.padEnd(2, '0') || '0')

  if (!Number.isFinite(minor) || !Number.isSafeInteger(minor) || minor <= 0) return null
  return minor
}

/** ממיר יחידות משנה חזרה למחרוזת עשרונית לעריכה בטופס (ללא סימן מטבע). */
export function minorToAmountInput(amountMinor: number): string {
  return (amountMinor / MINOR_UNITS_PER_MAJOR).toFixed(2)
}

/** מעצב סכום לתצוגה, כולל סימן המטבע, לפי השפה הפעילה. */
export function formatMoney(amountMinor: number, currency: Currency, locale = 'he-IL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / MINOR_UNITS_PER_MAJOR)
}

/**
 * סכום תשלום חודשי משוער. העיגול הוא כלפי מעלה ביחידת משנה אחת
 * כדי שסכום התשלומים לא ייפול מתחת לסכום ההוצאה.
 */
export function installmentAmountMinor(amountMinor: number, installmentsCount: number): number {
  if (installmentsCount <= 1) return amountMinor
  return Math.ceil(amountMinor / installmentsCount)
}
