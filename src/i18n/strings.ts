export const LANGUAGES = ['he', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_META: Record<Language, { label: string; dir: 'rtl' | 'ltr'; locale: string }> =
  {
    he: { label: 'עברית', dir: 'rtl', locale: 'he-IL' },
    en: { label: 'English', dir: 'ltr', locale: 'en-US' },
  }

const he = {
  'app.title': 'הוצאות',
  'app.subtitle': 'הוספת הוצאה בשניות',

  'form.legend': 'הוצאה חדשה',
  'form.amount': 'סכום',
  'form.amountPlaceholder': '0.00',
  'form.currency': 'מטבע',
  'form.merchant': 'שם החנות / מקום',
  'form.merchantPlaceholder': 'רמי לוי, פז, ארומה…',
  'form.description': 'פירוט ההוצאה (לא חובה)',
  'form.descriptionLabel': 'פירוט ההוצאה',
  'form.descriptionPlaceholder': 'סופרמרקט, דלק, מסעדה…',
  'form.paymentMethod': 'אמצעי תשלום',
  'form.cash': 'מזומן',
  'form.credit': 'אשראי',
  'form.cardLast4': 'כרטיס',
  'form.cardLast4Placeholder': '1234',
  'form.cardNew': '+ כרטיס חדש…',
  'form.installments': 'מספר תשלומים',
  'form.installmentHint': 'כ-{amount} לתשלום, {count} תשלומים',
  'form.dateTime': 'תאריך ושעה',
  'form.dateTimeAuto': 'נשמר אוטומטית: {value}',
  'form.add': 'הוספה',
  'form.adding': 'שומר…',
  'form.save': 'שמירה',
  'form.cancel': 'ביטול',
  'form.suggestionsLabel': 'פירוטים קודמים',
  'form.merchantSuggestionsLabel': 'חנויות קודמות',

  'errors.amountRequired': 'יש להזין סכום',
  'errors.amountInvalid': 'סכום לא תקין — עד שתי ספרות אחרי הנקודה',
  'errors.merchantRequired': 'יש להזין שם חנות או מקום',
  'errors.merchantTooLong': 'שם החנות ארוך מדי',
  'errors.descriptionTooLong': 'הפירוט ארוך מדי',
  'errors.cardLast4Invalid': 'יש להזין 4 ספרות אחרונות של הכרטיס',
  'errors.installmentsOutOfRange': 'מספר תשלומים חייב להיות בין 1 ל-36',
  'errors.dateTimeInvalid': 'תאריך או שעה לא תקינים',
  'errors.saveFailed': 'השמירה נכשלה. נסה שוב.',
  'errors.loadFailed': 'טעינת הנתונים נכשלה.',
  'errors.restoreFailed': 'שחזור הקובץ נכשל — ייתכן שהקובץ אינו תקין.',

  'toast.added': 'ההוצאה נוספה',
  'toast.updated': 'ההוצאה עודכנה',
  'toast.deleted': 'ההוצאה נמחקה',
  'toast.restored': 'שוחזרו {count} הוצאות',
  'toast.exported': 'הקובץ נוצר',

  'list.title': 'הוצאות אחרונות',
  'list.empty': 'עדיין אין הוצאות. הוסף את הראשונה למעלה.',
  'list.emptyFiltered': 'אין הוצאות שמתאימות לסינון.',
  'list.resultCount': '{count} הוצאות',
  'list.edit': 'עריכה',
  'list.delete': 'מחיקה',
  'list.installments': '{count} תשלומים',
  'list.card': 'כרטיס •••• {last4}',

  'filters.title': 'חיפוש וסינון',
  'filters.search': 'חיפוש בחנות ובפירוט',
  'filters.searchPlaceholder': 'למשל: רמי לוי',
  'filters.from': 'מתאריך',
  'filters.to': 'עד תאריך',
  'filters.currency': 'מטבע',
  'filters.paymentMethod': 'אמצעי תשלום',
  'filters.all': 'הכל',
  'filters.sortField': 'מיון לפי',
  'filters.sortByDate': 'תאריך',
  'filters.sortByAmount': 'סכום',
  'filters.sortDirection': 'סדר',
  'filters.desc': 'יורד',
  'filters.asc': 'עולה',
  'filters.clear': 'נקה סינון',

  'summary.title': 'סיכומים',
  'summary.today': 'היום',
  'summary.month': 'החודש',
  'summary.cash': 'מזומן',
  'summary.credit': 'אשראי',
  'summary.total': 'סך הכל',
  'summary.empty': 'אין נתונים להצגה.',
  'summary.perCurrencyNote':
    'הסיכומים מוצגים בנפרד לכל מטבע. אין המרת מטבע, ולכן סכומים במטבעות שונים אינם מחוברים.',

  'settings.title': 'נתונים והגדרות',
  'settings.language': 'שפה',
  'settings.exportCsv': 'ייצוא ל-CSV',
  'export.title': 'ייצוא ל-CSV',
  'export.intro': 'בחר טווח תאריכים ואמצעי תשלום. השארת תאריך ריק מייצאת ללא הגבלה בצד הזה.',
  'export.count': '{count} הוצאות ייוצאו',
  'export.empty': 'אין הוצאות שמתאימות לבחירה',
  'export.action': 'ייצוא',
  'settings.backupJson': 'גיבוי לקובץ JSON',
  'settings.restoreJson': 'שחזור מקובץ JSON',
  'settings.restoreConfirmTitle': 'שחזור יחליף את כל הנתונים',
  'settings.restoreConfirmBody':
    'השחזור ימחק את כל {current} ההוצאות הקיימות ויחליף אותן ב-{incoming} הוצאות מהקובץ. לא ניתן לבטל פעולה זו.',
  'settings.restoreConfirmAction': 'שחזר והחלף',
  'settings.storageNoticeTitle': 'הנתונים נשמרים במכשיר בלבד',
  'settings.storageNoticeBody':
    'כל ההוצאות נשמרות מקומית בדפדפן של המכשיר הזה. זהו אינו גיבוי בענן: מחיקת נתוני האתר, גלישה במצב פרטי או מעבר למכשיר אחר יגרמו לאובדן הגישה לנתונים. השתמש בגיבוי ל-JSON כדי לשמור עותק.',
  'settings.installHintTitle': 'התקנה במסך הבית (iPhone)',
  'settings.installHintBody':
    'פתח את הכתובת בסאפארי, לחץ על כפתור השיתוף ובחר "הוסף למסך הבית". לאחר ההתקנה האפליקציה תיפתח במסך מלא ותעבוד גם ללא אינטרנט.',
  'settings.dismiss': 'הבנתי',

  'confirm.deleteTitle': 'למחוק את ההוצאה?',
  'confirm.deleteBody': '{description} · {amount}',
  'confirm.delete': 'מחק',
  'confirm.cancel': 'ביטול',

  'edit.title': 'עריכת הוצאה',
  'edit.close': 'סגירה',

  'common.loading': 'טוען…',
} as const

export type StringKey = keyof typeof he

const en: Record<StringKey, string> = {
  'app.title': 'Expenses',
  'app.subtitle': 'Add an expense in seconds',

  'form.legend': 'New expense',
  'form.amount': 'Amount',
  'form.amountPlaceholder': '0.00',
  'form.currency': 'Currency',
  'form.merchant': 'Store / place',
  'form.merchantPlaceholder': 'Trader Joe’s, Shell, Starbucks…',
  'form.description': 'Description (optional)',
  'form.descriptionLabel': 'Description',
  'form.descriptionPlaceholder': 'Groceries, fuel, restaurant…',
  'form.paymentMethod': 'Payment method',
  'form.cash': 'Cash',
  'form.credit': 'Credit',
  'form.cardLast4': 'Card',
  'form.cardLast4Placeholder': '1234',
  'form.cardNew': '+ New card…',
  'form.installments': 'Installments',
  'form.installmentHint': 'About {amount} per installment, {count} installments',
  'form.dateTime': 'Date and time',
  'form.dateTimeAuto': 'Saved automatically: {value}',
  'form.add': 'Add',
  'form.adding': 'Saving…',
  'form.save': 'Save',
  'form.cancel': 'Cancel',
  'form.suggestionsLabel': 'Previous descriptions',
  'form.merchantSuggestionsLabel': 'Previous stores',

  'errors.amountRequired': 'Enter an amount',
  'errors.amountInvalid': 'Invalid amount — up to two decimal places',
  'errors.merchantRequired': 'Enter a store or place',
  'errors.merchantTooLong': 'Store name is too long',
  'errors.descriptionTooLong': 'Description is too long',
  'errors.cardLast4Invalid': 'Enter the card’s last 4 digits',
  'errors.installmentsOutOfRange': 'Installments must be between 1 and 36',
  'errors.dateTimeInvalid': 'Invalid date or time',
  'errors.saveFailed': 'Saving failed. Please try again.',
  'errors.loadFailed': 'Could not load your data.',
  'errors.restoreFailed': 'Restore failed — the file may be invalid.',

  'toast.added': 'Expense added',
  'toast.updated': 'Expense updated',
  'toast.deleted': 'Expense deleted',
  'toast.restored': 'Restored {count} expenses',
  'toast.exported': 'File created',

  'list.title': 'Recent expenses',
  'list.empty': 'No expenses yet. Add your first one above.',
  'list.emptyFiltered': 'No expenses match the current filters.',
  'list.resultCount': '{count} expenses',
  'list.edit': 'Edit',
  'list.delete': 'Delete',
  'list.installments': '{count} installments',
  'list.card': 'Card •••• {last4}',

  'filters.title': 'Search and filter',
  'filters.search': 'Search stores and descriptions',
  'filters.searchPlaceholder': 'e.g. Starbucks',
  'filters.from': 'From',
  'filters.to': 'To',
  'filters.currency': 'Currency',
  'filters.paymentMethod': 'Payment method',
  'filters.all': 'All',
  'filters.sortField': 'Sort by',
  'filters.sortByDate': 'Date',
  'filters.sortByAmount': 'Amount',
  'filters.sortDirection': 'Order',
  'filters.desc': 'Descending',
  'filters.asc': 'Ascending',
  'filters.clear': 'Clear filters',

  'summary.title': 'Summary',
  'summary.today': 'Today',
  'summary.month': 'This month',
  'summary.cash': 'Cash',
  'summary.credit': 'Credit',
  'summary.total': 'Total',
  'summary.empty': 'Nothing to summarize yet.',
  'summary.perCurrencyNote':
    'Totals are shown separately per currency. There is no currency conversion, so amounts in different currencies are never added together.',

  'settings.title': 'Data and settings',
  'settings.language': 'Language',
  'settings.exportCsv': 'Export to CSV',
  'export.title': 'Export to CSV',
  'export.intro':
    'Pick a date range and a payment method. Leaving a date empty means no limit on that side.',
  'export.count': '{count} expenses will be exported',
  'export.empty': 'No expenses match this selection',
  'export.action': 'Export',
  'settings.backupJson': 'Back up to JSON',
  'settings.restoreJson': 'Restore from JSON',
  'settings.restoreConfirmTitle': 'Restore will replace all data',
  'settings.restoreConfirmBody':
    'This will delete all {current} existing expenses and replace them with {incoming} expenses from the file. This cannot be undone.',
  'settings.restoreConfirmAction': 'Restore and replace',
  'settings.storageNoticeTitle': 'Data is stored on this device only',
  'settings.storageNoticeBody':
    'All expenses are stored locally in this device’s browser. This is not a cloud backup: clearing site data, private browsing, or switching devices will lose access to it. Use the JSON backup to keep a copy.',
  'settings.installHintTitle': 'Install on your iPhone home screen',
  'settings.installHintBody':
    'Open the address in Safari, tap the Share button and choose "Add to Home Screen". Once installed the app opens full-screen and works offline.',
  'settings.dismiss': 'Got it',

  'confirm.deleteTitle': 'Delete this expense?',
  'confirm.deleteBody': '{description} · {amount}',
  'confirm.delete': 'Delete',
  'confirm.cancel': 'Cancel',

  'edit.title': 'Edit expense',
  'edit.close': 'Close',

  'common.loading': 'Loading…',
}

export const DICTIONARIES: Record<Language, Record<StringKey, string>> = { he, en }

/** החלפת מצייני מקום בסגנון {name}. */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}
