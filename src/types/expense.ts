export const CURRENCIES = ['ILS', 'EUR', 'USD'] as const
export type Currency = (typeof CURRENCIES)[number]

export const PAYMENT_METHODS = ['cash', 'credit'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/**
 * מצב הסנכרון של רשומה. בגרסה הראשונה כל הרשומות הן 'local'.
 * השדה קיים מראש כדי שהוספת Backend ב-C# לא תחייב מיגרציית סכמה.
 */
export const SYNC_STATUSES = ['local', 'synced', 'pendingCreate', 'pendingUpdate'] as const
export type SyncStatus = (typeof SYNC_STATUSES)[number]

export const MIN_INSTALLMENTS = 1
export const MAX_INSTALLMENTS = 36

/**
 * כרטיס מיוצג בארבע ספרותיו האחרונות בלבד; לעולם לא מספר כרטיס מלא או CVV.
 * אין רשימה קבועה מראש — הרשימה נבנית מהערכים שהמשתמש הקליד ונשמרת
 * ב-localStorage (ראה data/preferences.ts).
 */
export const CARD_LAST4_PATTERN = /^\d{4}$/
export const CARD_LAST4_LENGTH = 4
/** כמה כרטיסים אחרונים נשמרים כהצעות. מעבר לכך הישנים נשכחים. */
export const MAX_REMEMBERED_CARDS = 8

export interface Expense {
  id: string
  /** סכום ביחידות משנה שלמות (אגורות/סנטים) — מונע שגיאות עשרוניות בסיכומים. */
  amountMinor: number
  currency: Currency
  /** שם החנות או המקום — שדה חובה. */
  merchant: string
  /** פירוט ההוצאה — אופציונלי. */
  description?: string
  paymentMethod: PaymentMethod
  /** ארבע ספרות אחרונות של הכרטיס. רק כשאמצעי התשלום הוא 'credit'. */
  cardLast4?: string
  installmentsCount: number
  /** מועד ההוצאה, ISO 8601 עם אופסט מקומי. */
  dateTime: string
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
  serverId?: string
}

/** השדות שהמשתמש מספק. המטא-דאטה (id, חתימות זמן, סנכרון) נוספת בשכבת האחסון. */
export interface ExpenseInput {
  amountMinor: number
  currency: Currency
  merchant: string
  description?: string
  paymentMethod: PaymentMethod
  cardLast4?: string
  installmentsCount: number
  dateTime: string
}

/** הערכים הגולמיים של הטופס, לפני המרה ל-ExpenseInput. */
export interface ExpenseFormValues {
  amount: string
  currency: Currency
  merchant: string
  description: string
  paymentMethod: PaymentMethod
  cardLast4: string
  installmentsCount: number
  dateTime: string
}
