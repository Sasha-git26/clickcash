import {
  CARD_LAST4_PATTERN,
  CURRENCIES,
  MAX_INSTALLMENTS,
  MIN_INSTALLMENTS,
  type Currency,
  type Expense,
  type ExpenseFormValues,
  type ExpenseInput,
} from '../types/expense'
import { parseAmountToMinor } from './money'
import { fromDateTimeLocalValue, toLocalIsoString } from './datetime'

export const MAX_DESCRIPTION_LENGTH = 80
export const MAX_MERCHANT_LENGTH = 60

/** שדות הטופס שעלולים לשאת שגיאת ולידציה. */
export type ExpenseFieldError =
  | 'amount'
  | 'description'
  | 'merchant'
  | 'cardLast4'
  | 'installmentsCount'
  | 'dateTime'

/** מפתחות הודעות שגיאה — התרגום עצמו נעשה בשכבת ה-i18n. */
export type ValidationErrorCode =
  | 'amountRequired'
  | 'amountInvalid'
  | 'merchantRequired'
  | 'merchantTooLong'
  | 'descriptionTooLong'
  | 'cardLast4Invalid'
  | 'installmentsOutOfRange'
  | 'dateTimeInvalid'

export type ValidationErrors = Partial<Record<ExpenseFieldError, ValidationErrorCode>>

export type ValidationResult =
  | { ok: true; value: ExpenseInput }
  | { ok: false; errors: ValidationErrors }

/**
 * מאמת את ערכי הטופס וממיר אותם ל-ExpenseInput.
 *
 * כשאמצעי התשלום הוא 'cash', שדות האשראי נזנחים ואינם נבדקים —
 * כך שהחלפה לאשראי וחזרה למזומן לא משאירה שאריות.
 *
 * `values.dateTime` הוא בפורמט של <input type="datetime-local">.
 * מחרוזת ריקה משמעותה "עכשיו" — כך טופס ההוספה חותם אוטומטית
 * את תאריך ושעת ההוצאה לפי השעון המקומי.
 */
export function validateExpenseForm(values: ExpenseFormValues, now: Date = new Date()): ValidationResult {
  const errors: ValidationErrors = {}

  if (values.amount.trim() === '') {
    errors.amount = 'amountRequired'
  } else if (parseAmountToMinor(values.amount) === null) {
    errors.amount = 'amountInvalid'
  }

  const merchant = values.merchant.trim()
  if (merchant === '') {
    errors.merchant = 'merchantRequired'
  } else if (merchant.length > MAX_MERCHANT_LENGTH) {
    errors.merchant = 'merchantTooLong'
  }

  // הפירוט אופציונלי; נבדק רק אם הוזן.
  const description = values.description.trim()
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = 'descriptionTooLong'
  }

  const isCredit = values.paymentMethod === 'credit'

  if (isCredit) {
    // באשראי חובה להזין ארבע ספרות; אין ברירת מחדל שתכסה על שדה ריק.
    if (!CARD_LAST4_PATTERN.test(values.cardLast4.trim())) {
      errors.cardLast4 = 'cardLast4Invalid'
    }
    if (
      !Number.isInteger(values.installmentsCount) ||
      values.installmentsCount < MIN_INSTALLMENTS ||
      values.installmentsCount > MAX_INSTALLMENTS
    ) {
      errors.installmentsCount = 'installmentsOutOfRange'
    }
  }

  const dateTime =
    values.dateTime.trim() === ''
      ? toLocalIsoString(now)
      : fromDateTimeLocalValue(values.dateTime)
  if (dateTime === null) errors.dateTime = 'dateTimeInvalid'

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const amountMinor = parseAmountToMinor(values.amount)
  // כבר אומת למעלה; הבדיקות כאן הן לטובת צמצום הטיפוס.
  if (amountMinor === null) return { ok: false, errors: { amount: 'amountInvalid' } }
  if (dateTime === null) return { ok: false, errors: { dateTime: 'dateTimeInvalid' } }

  const input: ExpenseInput = {
    amountMinor,
    currency: values.currency,
    merchant,
    paymentMethod: values.paymentMethod,
    installmentsCount: isCredit ? values.installmentsCount : 1,
    dateTime,
  }
  if (description !== '') input.description = description
  if (isCredit) input.cardLast4 = values.cardLast4.trim()

  return { ok: true, value: input }
}

function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)
}

/**
 * בודק שרשומה שהגיעה מקובץ גיבוי חיצוני תקינה לפני כתיבתה למסד.
 * שדות חסרים משוחזרים לברירת מחדל סבירה במקום להפיל את כל הייבוא.
 */
export function parseRestoredExpense(raw: unknown): Expense | null {
  if (typeof raw !== 'object' || raw === null) return null
  const candidate = raw as Record<string, unknown>

  const id = candidate.id
  if (typeof id !== 'string' || id === '') return null

  // תמיכה גם בקבצי גיבוי שבהם הסכום נשמר כ-amount עשרוני.
  let amountMinor: number | null = null
  if (typeof candidate.amountMinor === 'number' && Number.isSafeInteger(candidate.amountMinor)) {
    amountMinor = candidate.amountMinor
  } else if (typeof candidate.amount === 'number' && Number.isFinite(candidate.amount)) {
    amountMinor = Math.round(candidate.amount * 100)
  }
  if (amountMinor === null || amountMinor <= 0) return null

  if (!isCurrency(candidate.currency)) return null

  const rawDescription = typeof candidate.description === 'string' ? candidate.description.trim() : ''
  // קובץ גיבוי מגרסה שבה הפירוט היה השדה הראשי: הוא הופך לשם החנות.
  const rawMerchant =
    typeof candidate.merchant === 'string' && candidate.merchant.trim() !== ''
      ? candidate.merchant.trim()
      : rawDescription
  if (rawMerchant === '') return null

  const merchant = rawMerchant.slice(0, MAX_MERCHANT_LENGTH)
  const description =
    rawDescription === '' || rawDescription === rawMerchant
      ? undefined
      : rawDescription.slice(0, MAX_DESCRIPTION_LENGTH)

  const paymentMethod = candidate.paymentMethod === 'credit' ? 'credit' : 'cash'

  const cardLast4 =
    paymentMethod === 'credit' && typeof candidate.cardLast4 === 'string' &&
    CARD_LAST4_PATTERN.test(candidate.cardLast4)
      ? candidate.cardLast4
      : undefined

  const rawInstallments = candidate.installmentsCount
  const installmentsCount =
    paymentMethod === 'credit' &&
    typeof rawInstallments === 'number' &&
    Number.isInteger(rawInstallments) &&
    rawInstallments >= MIN_INSTALLMENTS &&
    rawInstallments <= MAX_INSTALLMENTS
      ? rawInstallments
      : 1

  const dateTime = typeof candidate.dateTime === 'string' ? candidate.dateTime : null
  if (dateTime === null || Number.isNaN(Date.parse(dateTime))) return null

  const createdAt =
    typeof candidate.createdAt === 'string' && !Number.isNaN(Date.parse(candidate.createdAt))
      ? candidate.createdAt
      : dateTime
  const updatedAt =
    typeof candidate.updatedAt === 'string' && !Number.isNaN(Date.parse(candidate.updatedAt))
      ? candidate.updatedAt
      : createdAt

  const expense: Expense = {
    id,
    amountMinor,
    currency: candidate.currency,
    merchant,
    paymentMethod,
    installmentsCount,
    dateTime,
    createdAt,
    updatedAt,
    syncStatus: 'local',
  }
  if (description) expense.description = description
  if (cardLast4) expense.cardLast4 = cardLast4

  return expense
}
