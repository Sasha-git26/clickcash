import {
  CARD_LAST4_PATTERN,
  CURRENCIES,
  MAX_REMEMBERED_CARDS,
  type Currency,
} from '../types/expense'
import { isLanguage, type Language } from '../i18n/strings'

/**
 * העדפות ממשק נשמרות ב-localStorage ולא ב-IndexedDB, כדי שניתן לקרוא אותן
 * סינכרונית בעלייה ולא תהיה הבהקה של שפה או כיווניות שגויה.
 * זו העדפה פר-מכשיר; ההוצאות עצמן נשמרות ב-IndexedDB.
 *
 * כל גישה עטופה ב-try/catch: בגלישה פרטית או כשנתוני האתר חסומים,
 * localStorage עשוי לזרוק חריגה.
 */
export const PREFERENCE_KEYS = {
  language: 'hotzaot.language',
  lastCurrency: 'hotzaot.lastCurrency',
  knownCards: 'hotzaot.knownCards',
  storageNoticeDismissed: 'hotzaot.storageNoticeDismissed',
} as const

const KEYS = PREFERENCE_KEYS

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // אין מה לעשות — האפליקציה ממשיכה לעבוד עם ברירות המחדל.
  }
}

/** ברירת המחדל היא אנגלית; עברית נבחרת ידנית בהגדרות ונשמרת להפעלות הבאות. */
export const DEFAULT_LANGUAGE: Language = 'en'

export function loadLanguage(): Language {
  const stored = read(KEYS.language)
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

export function saveLanguage(language: Language): void {
  write(KEYS.language, language)
}

export function loadLastCurrency(): Currency {
  const stored = read(KEYS.lastCurrency)
  return stored !== null && (CURRENCIES as readonly string[]).includes(stored)
    ? (stored as Currency)
    : 'ILS'
}

export function saveLastCurrency(currency: Currency): void {
  write(KEYS.lastCurrency, currency)
}

/**
 * ארבע הספרות של הכרטיסים שהמשתמש הקליד, מהאחרון בשימוש ואחורה.
 * ריקה לגמרי עד ההוצאה הראשונה באשראי — אין כרטיסים מוגדרים מראש.
 * הראשון ברשימה הוא ברירת המחדל בטופס.
 */
export function loadKnownCards(): string[] {
  const stored = read(KEYS.knownCards)
  if (stored === null) return []
  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    const cards = parsed.filter(
      (card): card is string => typeof card === 'string' && CARD_LAST4_PATTERN.test(card),
    )
    return [...new Set(cards)].slice(0, MAX_REMEMBERED_CARDS)
  } catch {
    // ערך פגום ב-localStorage לא אמור להפיל את הטופס.
    return []
  }
}

/**
 * שומרת כרטיס שנעשה בו שימוש ומחזירה את הרשימה המעודכנת, כשהוא בראשה.
 * ה-localStorage הוא מקור האמת, כך שקריאות עוקבות באותו רינדור לא דורסות זו את זו.
 */
export function rememberCard(card: string): string[] {
  const current = loadKnownCards()
  if (!CARD_LAST4_PATTERN.test(card)) return current

  const next = [card, ...current.filter((existing) => existing !== card)].slice(
    0,
    MAX_REMEMBERED_CARDS,
  )
  write(KEYS.knownCards, JSON.stringify(next))
  return next
}

export function loadStorageNoticeDismissed(): boolean {
  return read(KEYS.storageNoticeDismissed) === 'true'
}

export function saveStorageNoticeDismissed(): void {
  write(KEYS.storageNoticeDismissed, 'true')
}
