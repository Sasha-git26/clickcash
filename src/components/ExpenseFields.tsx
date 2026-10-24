import { useId, type FocusEvent } from 'react'
import {
  CURRENCIES,
  MAX_INSTALLMENTS,
  MIN_INSTALLMENTS,
  type Currency,
  type ExpenseFormValues,
  type PaymentMethod,
} from '../types/expense'
import { CURRENCY_SYMBOLS, formatMoney, installmentAmountMinor, parseAmountToMinor } from '../domain/money'
import type { ValidationErrors } from '../domain/validation'
import { CardField } from './CardField'
import { useI18n } from '../i18n/I18nProvider'

const INSTALLMENT_OPTIONS = Array.from(
  { length: MAX_INSTALLMENTS - MIN_INSTALLMENTS + 1 },
  (_, index) => MIN_INSTALLMENTS + index,
)

/**
 * כשהמקלדת של iOS נפתחת, הדפדפן מקטין את אזור התוכן (interactive-widget).
 * גלילת השדה למרכז לאחר מכן מבטיחה שהוא לא יישאר מתחת למקלדת.
 */
function scrollFieldIntoView(event: FocusEvent<HTMLElement>) {
  const target = event.currentTarget
  if (typeof target.scrollIntoView !== 'function') return
  setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
}

interface ExpenseFieldsProps {
  values: ExpenseFormValues
  errors: ValidationErrors
  descriptionSuggestions: string[]
  merchantSuggestions: string[]
  /** כרטיסים שהוקלדו בעבר, מהאחרון בשימוש ואחורה. ריק לפני ההוצאה הראשונה באשראי. */
  knownCards: string[]
  disabled?: boolean
  /** מציג שדה תאריך ושעה הניתן לעריכה (מסך העריכה בלבד). */
  showDateTime?: boolean
  autoFocusAmount?: boolean
  onChange: <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) => void
}

export function ExpenseFields({
  values,
  errors,
  descriptionSuggestions,
  merchantSuggestions,
  knownCards,
  disabled = false,
  showDateTime = false,
  autoFocusAmount = false,
  onChange,
}: ExpenseFieldsProps) {
  const { t, locale } = useI18n()
  const idPrefix = useId()
  const amountId = `${idPrefix}-amount`
  const currencyId = `${idPrefix}-currency`
  const descriptionId = `${idPrefix}-description`
  const suggestionsId = `${idPrefix}-suggestions`
  const merchantId = `${idPrefix}-merchant`
  const merchantSuggestionsId = `${idPrefix}-merchant-suggestions`
  const cardId = `${idPrefix}-card`
  const installmentsId = `${idPrefix}-installments`
  const dateTimeId = `${idPrefix}-datetime`

  const isCredit = values.paymentMethod === 'credit'

  const amountMinor = parseAmountToMinor(values.amount)
  const showInstallmentHint = isCredit && values.installmentsCount > 1 && amountMinor !== null

  return (
    <div className="space-y-4">
      {/* סכום ומטבע באותה שורה — הצעד הראשון והנפוץ ביותר בהזנה. */}
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <label className="field-label" htmlFor={amountId}>
            {t('form.amount')}
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-lg text-ink-muted"
            >
              {CURRENCY_SYMBOLS[values.currency]}
            </span>
            <input
              id={amountId}
              // type="text" + inputMode="decimal" פותח מקלדת מספרית באייפון
              // ומאפשר נקודה עשרונית, בניגוד ל-type="number" שמתנהג בעייתי בסאפארי.
              type="text"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="next"
              dir="ltr"
              className={`field-input ps-9 text-xl font-semibold ${
                errors.amount ? 'field-input-invalid' : ''
              }`}
              placeholder={t('form.amountPlaceholder')}
              value={values.amount}
              disabled={disabled}
              autoFocus={autoFocusAmount}
              aria-invalid={errors.amount ? true : undefined}
              aria-errormessage={errors.amount ? `${amountId}-error` : undefined}
              onFocus={scrollFieldIntoView}
              onChange={(event) => onChange('amount', event.target.value)}
            />
          </div>
        </div>

        <div className="w-28 shrink-0">
          <label className="field-label" htmlFor={currencyId}>
            {t('form.currency')}
          </label>
          <select
            id={currencyId}
            className="field-input py-3"
            value={values.currency}
            disabled={disabled}
            onChange={(event) => onChange('currency', event.target.value as Currency)}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {CURRENCY_SYMBOLS[currency]} {currency}
              </option>
            ))}
          </select>
        </div>
      </div>
      {errors.amount && (
        <p className="field-error" id={`${amountId}-error`} role="alert">
          {t(`errors.${errors.amount}`)}
        </p>
      )}

      {/* שם החנות הוא השדה הנדרש ומופיע לפני הפירוט. */}
      <div>
        <label className="field-label" htmlFor={merchantId}>
          {t('form.merchant')}
        </label>
        <input
          id={merchantId}
          type="text"
          autoComplete="off"
          enterKeyHint="next"
          // datalist מספק השלמה אוטומטית מערכים קודמים בלי לכפות בחירה מרשימה סגורה.
          list={merchantSuggestions.length > 0 ? merchantSuggestionsId : undefined}
          className={`field-input ${errors.merchant ? 'field-input-invalid' : ''}`}
          placeholder={t('form.merchantPlaceholder')}
          value={values.merchant}
          disabled={disabled}
          aria-invalid={errors.merchant ? true : undefined}
          aria-errormessage={errors.merchant ? `${merchantId}-error` : undefined}
          onFocus={scrollFieldIntoView}
          onChange={(event) => onChange('merchant', event.target.value)}
        />
        {merchantSuggestions.length > 0 && (
          <datalist id={merchantSuggestionsId} aria-label={t('form.merchantSuggestionsLabel')}>
            {merchantSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        )}
        {errors.merchant && (
          <p className="field-error" id={`${merchantId}-error`} role="alert">
            {t(`errors.${errors.merchant}`)}
          </p>
        )}
      </div>

      <div>
        <label className="field-label" htmlFor={descriptionId}>
          {t('form.description')}
        </label>
        <input
          id={descriptionId}
          type="text"
          autoComplete="off"
          enterKeyHint="done"
          list={descriptionSuggestions.length > 0 ? suggestionsId : undefined}
          className={`field-input ${errors.description ? 'field-input-invalid' : ''}`}
          placeholder={t('form.descriptionPlaceholder')}
          value={values.description}
          disabled={disabled}
          aria-invalid={errors.description ? true : undefined}
          aria-errormessage={errors.description ? `${descriptionId}-error` : undefined}
          onFocus={scrollFieldIntoView}
          onChange={(event) => onChange('description', event.target.value)}
        />
        {descriptionSuggestions.length > 0 && (
          <datalist id={suggestionsId} aria-label={t('form.suggestionsLabel')}>
            {descriptionSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        )}
        {errors.description && (
          <p className="field-error" id={`${descriptionId}-error`} role="alert">
            {t(`errors.${errors.description}`)}
          </p>
        )}
      </div>

      <fieldset disabled={disabled}>
        <legend className="field-label">{t('form.paymentMethod')}</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-muted p-1">
          {(['cash', 'credit'] as PaymentMethod[]).map((method) => {
            const active = values.paymentMethod === method
            return (
              <button
                key={method}
                type="button"
                aria-pressed={active}
                className={`btn min-h-11 ${
                  active ? 'bg-brand text-brand-fg' : 'text-ink-muted'
                }`}
                onClick={() => onChange('paymentMethod', method)}
              >
                {method === 'cash' ? t('form.cash') : t('form.credit')}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* שדות האשראי מוצגים רק בבחירת "אשראי" — במזומן הם מוסתרים לגמרי. */}
      {isCredit && (
        <div className="space-y-4 rounded-xl border border-line bg-surface-muted p-3">
          <div className="flex gap-3">
            <div className="w-28 shrink-0">
              <label className="field-label" htmlFor={cardId}>
                {t('form.cardLast4')}
              </label>
              {/*
                רשימת כל הכרטיסים שהוקלדו, עם אופציה להוסיף חדש.
                בפעם הראשונה, כשהרשימה ריקה, CardField מציג ישר שדה הקלדה.
              */}
              <CardField
                id={cardId}
                value={values.cardLast4}
                knownCards={knownCards}
                disabled={disabled}
                invalid={errors.cardLast4 !== undefined}
                errorId={`${cardId}-error`}
                onFocus={scrollFieldIntoView}
                onChange={(card) => onChange('cardLast4', card)}
              />
            </div>

            <div className="w-28 shrink-0">
              <label className="field-label" htmlFor={installmentsId}>
                {t('form.installments')}
              </label>
              <select
                id={installmentsId}
                className="field-input py-3"
                value={values.installmentsCount}
                disabled={disabled}
                onChange={(event) => onChange('installmentsCount', Number(event.target.value))}
              >
                {INSTALLMENT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errors.cardLast4 && (
            <p className="field-error" id={`${cardId}-error`} role="alert">
              {t(`errors.${errors.cardLast4}`)}
            </p>
          )}
          {errors.installmentsCount && (
            <p className="field-error" role="alert">
              {t(`errors.${errors.installmentsCount}`)}
            </p>
          )}

          {showInstallmentHint && (
            <p className="text-sm text-ink-muted">
              {t('form.installmentHint', {
                amount: formatMoney(
                  installmentAmountMinor(amountMinor, values.installmentsCount),
                  values.currency,
                  locale,
                ),
                count: values.installmentsCount,
              })}
            </p>
          )}
        </div>
      )}

      {showDateTime && (
        <div>
          <label className="field-label" htmlFor={dateTimeId}>
            {t('form.dateTime')}
          </label>
          <input
            id={dateTimeId}
            type="datetime-local"
            className="field-input"
            value={values.dateTime}
            disabled={disabled}
            onFocus={scrollFieldIntoView}
            onChange={(event) => onChange('dateTime', event.target.value)}
          />
          {errors.dateTime && (
            <p className="field-error" role="alert">
              {t(`errors.${errors.dateTime}`)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
