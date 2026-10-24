function pad(value: number, length = 2): string {
  return String(Math.abs(value)).padStart(length, '0')
}

/**
 * ISO 8601 עם האופסט המקומי של המכשיר (למשל 2026-10-23T14:05:00+03:00).
 * שומרים את האופסט כדי שהוצאה שנרשמה בשעון מקומי תישאר קריאה נכון
 * גם אם המכשיר יעבור אזור זמן או שעון קיץ.
 */
export function toLocalIsoString(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const offset = `${sign}${pad(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad(
    Math.abs(offsetMinutes) % 60,
  )}`
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offset}`
  )
}

/** ערך עבור <input type="datetime-local">, שאינו נושא אזור זמן. */
export function toDateTimeLocalValue(isoString: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** הופך ערך של <input type="datetime-local"> חזרה ל-ISO מקומי. */
export function fromDateTimeLocalValue(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) return null
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? '0'),
  )
  if (Number.isNaN(date.getTime())) return null
  return toLocalIsoString(date)
}

export function formatDateTime(isoString: string, locale: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
