import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Expense, ExpenseFormValues, ExpenseInput } from '../types/expense'
import { validateExpenseForm, type ValidationErrors } from '../domain/validation'
import { minorToAmountInput } from '../domain/money'
import { toDateTimeLocalValue } from '../domain/datetime'
import { ExpenseFields } from './ExpenseFields'
import { useI18n } from '../i18n/I18nProvider'

function toFormValues(expense: Expense, defaultCard: string): ExpenseFormValues {
  return {
    amount: minorToAmountInput(expense.amountMinor),
    currency: expense.currency,
    merchant: expense.merchant,
    description: expense.description ?? '',
    paymentMethod: expense.paymentMethod,
    // הוצאה שנשמרה כמזומן ועוברת לאשראי מתחילה מהכרטיס האחרון שהוקלד.
    cardLast4: expense.cardLast4 ?? defaultCard,
    installmentsCount: expense.installmentsCount,
    dateTime: toDateTimeLocalValue(expense.dateTime),
  }
}

interface EditExpenseSheetProps {
  expense: Expense
  descriptionSuggestions: string[]
  merchantSuggestions: string[]
  /** הכרטיסים שהוקלדו בעבר; הראשון משמש כברירת מחדל להוצאה ללא כרטיס. */
  knownCards: string[]
  /** מחזיר true כשהשמירה הצליחה; רק אז החלון נסגר. */
  onSave: (id: string, input: ExpenseInput) => Promise<boolean>
  onClose: () => void
}

export function EditExpenseSheet({
  expense,
  descriptionSuggestions,
  merchantSuggestions,
  knownCards,
  onSave,
  onClose,
}: EditExpenseSheetProps) {
  const { t } = useI18n()
  const defaultCard = knownCards[0] ?? ''
  const [values, setValues] = useState<ExpenseFormValues>(() => toFormValues(expense, defaultCard))
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)
  const saveLock = useRef(false)

  useEffect(() => {
    setValues(toFormValues(expense, defaultCard))
    setErrors({})
  }, [expense, defaultCard])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleChange<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key as keyof ValidationErrors]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveLock.current) return

    // שדה התאריך גלוי כאן, ולכן ריקונו הוא שגיאה ולא חתימה מחדש על "עכשיו".
    const result = validateExpenseForm(values, { dateTimeRequired: true })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    saveLock.current = true
    setSaving(true)
    try {
      if (await onSave(expense.id, result.value)) onClose()
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/40">
      {/* רקע לחיץ לסגירה; אינו ממוקד במקלדת כי יש כפתור ביטול מפורש. */}
      <div className="flex-1" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('edit.title')}
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-line bg-bg px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">{t('edit.title')}</h2>
          <button type="button" className="btn-ghost min-h-10 px-3" onClick={onClose}>
            {t('edit.close')}
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <ExpenseFields
            values={values}
            errors={errors}
            descriptionSuggestions={descriptionSuggestions}
            merchantSuggestions={merchantSuggestions}
            knownCards={knownCards}
            disabled={saving}
            showDateTime
            onChange={handleChange}
          />

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? t('form.adding') : t('form.save')}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              {t('form.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
