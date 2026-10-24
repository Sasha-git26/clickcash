import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { PAYMENT_METHODS, type Expense, type PaymentMethod } from '../types/expense'
import { applyFilters, DEFAULT_FILTERS } from '../domain/filters'
import { useI18n } from '../i18n/I18nProvider'

interface ExportCsvDialogProps {
  expenses: Expense[]
  /** מקבל את ההוצאות שנבחרו בלבד, מסודרות מהחדשה לישנה. */
  onExport: (expenses: Expense[]) => void
  onCancel: () => void
}

/**
 * ייצוא CSV עובר קודם דרך בחירת טווח תאריכים ואמצעי תשלום,
 * כדי שלא ייווצר קובץ של כל ההיסטוריה כשרוצים חודש אחד.
 * הסינון עצמו נעשה ב-applyFilters — אותה לוגיקה כמו ברשימה.
 */
export function ExportCsvDialog({ expenses, onExport, onCancel }: ExportCsvDialogProps) {
  const { t } = useI18n()
  const idPrefix = useId()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'all'>('all')
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const selected = useMemo(
    () => applyFilters(expenses, { ...DEFAULT_FILTERS, from, to, paymentMethod }),
    [expenses, from, to, paymentMethod],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idPrefix}-title`}
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl"
      >
        <h2 id={`${idPrefix}-title`} className="text-lg font-semibold text-ink">
          {t('export.title')}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t('export.intro')}</p>

        <div className="mt-4 space-y-3">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <label className="field-label" htmlFor={`${idPrefix}-from`}>
                {t('filters.from')}
              </label>
              <input
                id={`${idPrefix}-from`}
                type="date"
                className="field-input"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <label className="field-label" htmlFor={`${idPrefix}-to`}>
                {t('filters.to')}
              </label>
              <input
                id={`${idPrefix}-to`}
                type="date"
                className="field-input"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor={`${idPrefix}-method`}>
              {t('filters.paymentMethod')}
            </label>
            <select
              id={`${idPrefix}-method`}
              className="field-input"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod | 'all')}
            >
              <option value="all">{t('filters.all')}</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method === 'cash' ? t('form.cash') : t('form.credit')}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-ink-muted" role="status">
            {selected.length === 0
              ? t('export.empty')
              : t('export.count', { count: selected.length })}
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={selected.length === 0}
            onClick={() => onExport(selected)}
          >
            {t('export.action')}
          </button>
          <button type="button" ref={cancelRef} className="btn-ghost flex-1" onClick={onCancel}>
            {t('confirm.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
