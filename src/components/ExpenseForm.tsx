import { useCallback, useRef, useState, type FormEvent } from 'react'
import type { Currency, ExpenseFormValues, ExpenseInput } from '../types/expense'
import { validateExpenseForm, type ValidationErrors } from '../domain/validation'
import { ExpenseFields } from './ExpenseFields'
import { useI18n } from '../i18n/I18nProvider'

function emptyValues(currency: Currency, cardLast4: string): ExpenseFormValues {
  return {
    amount: '',
    currency,
    merchant: '',
    description: '',
    // ברירת המחדל חוזרת ל"מזומן" אחרי כל שמירה.
    paymentMethod: 'cash',
    // הכרטיס האחרון שהוקלד ממשיך להיות ברירת המחדל; ריק עד ההוצאה הראשונה באשראי.
    cardLast4,
    installmentsCount: 1,
    // ריק = "עכשיו"; הוולידציה חותמת את השעה המקומית בזמן השמירה.
    dateTime: '',
  }
}

interface ExpenseFormProps {
  /** המטבע שנבחר לאחרונה — נשמר בין הוספות ובין הפעלות. */
  initialCurrency: Currency
  descriptionSuggestions: string[]
  merchantSuggestions: string[]
  /** הכרטיסים שהוקלדו בעבר; הראשון הוא ברירת המחדל של שדה הכרטיס. */
  knownCards: string[]
  /** מחזיר true כשהשמירה הצליחה. בכישלון הערכים נשמרים בטופס כדי שלא יאבדו. */
  onSubmit: (input: ExpenseInput) => Promise<boolean>
  onCurrencyChange: (currency: Currency) => void
}

export function ExpenseForm({
  initialCurrency,
  descriptionSuggestions,
  merchantSuggestions,
  knownCards,
  onSubmit,
  onCurrencyChange,
}: ExpenseFormProps) {
  const { t } = useI18n()
  const [values, setValues] = useState<ExpenseFormValues>(() =>
    emptyValues(initialCurrency, knownCards[0] ?? ''),
  )
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submitting, setSubmitting] = useState(false)
  // ref נוסף על ה-state: מונע הוספה כפולה גם משתי לחיצות באותו טיק רינדור.
  const submitLock = useRef(false)

  const handleChange = useCallback(
    <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) => {
      setValues((current) => ({ ...current, [key]: value }))
      setErrors((current) => {
        if (!(key in current)) return current
        const next = { ...current }
        delete next[key as keyof ValidationErrors]
        return next
      })
      if (key === 'currency') onCurrencyChange(value as Currency)
    },
    [onCurrencyChange],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLock.current) return

    const result = validateExpenseForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    submitLock.current = true
    setSubmitting(true)
    setErrors({})
    try {
      // ניקוי סכום ופירוט רק לאחר שמירה מוצלחת; המטבע והכרטיס האחרונים נשמרים.
      if (await onSubmit(result.value)) {
        setValues(
          emptyValues(result.value.currency, result.value.cardLast4 ?? knownCards[0] ?? ''),
        )
      }
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  return (
    <form className="card space-y-4" onSubmit={handleSubmit} noValidate>
      <h2 className="section-title">{t('form.legend')}</h2>

      <ExpenseFields
        values={values}
        errors={errors}
        descriptionSuggestions={descriptionSuggestions}
        merchantSuggestions={merchantSuggestions}
        knownCards={knownCards}
        disabled={submitting}
        onChange={handleChange}
      />

      {/*
        כפתור ההוספה צמוד לשדות ולא מקובע לתחתית המסך, כדי שהמקלדת
        של האייפון לא תכסה אותו.
      */}
      <button type="submit" className="btn-primary w-full text-lg" disabled={submitting}>
        {submitting ? t('form.adding') : t('form.add')}
      </button>
    </form>
  )
}
