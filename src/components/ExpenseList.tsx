import type { Expense } from '../types/expense'
import { formatMoney, installmentAmountMinor } from '../domain/money'
import { formatDateTime } from '../domain/datetime'
import { useI18n } from '../i18n/I18nProvider'

interface ExpenseListProps {
  expenses: Expense[]
  /** האם יש סינון פעיל — משנה את הודעת הרשימה הריקה. */
  filtered: boolean
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseList({ expenses, filtered, onEdit, onDelete }: ExpenseListProps) {
  const { t, locale } = useI18n()

  if (expenses.length === 0) {
    return (
      <p className="card text-center text-ink-muted">
        {filtered ? t('list.emptyFiltered') : t('list.empty')}
      </p>
    )
  }

  return (
    <ul className="space-y-2" aria-label={t('list.title')}>
      {expenses.map((expense) => (
        <li key={expense.id} className="card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* שם החנות הוא הכותרת; הפירוט, אם הוזן, מופיע תחתיו. */}
              <p className="truncate font-medium text-ink">{expense.merchant}</p>
              {expense.description && (
                <p className="truncate text-sm text-ink-muted">{expense.description}</p>
              )}
              <p className="mt-0.5 text-sm text-ink-muted">
                {formatDateTime(expense.dateTime, locale)}
              </p>
            </div>
            <p className="shrink-0 text-lg font-semibold tabular-nums text-ink">
              {formatMoney(expense.amountMinor, expense.currency, locale)}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                expense.paymentMethod === 'cash'
                  ? 'bg-surface-muted text-ink-muted'
                  : 'bg-brand-soft text-brand-soft-fg'
              }`}
            >
              {expense.paymentMethod === 'cash' ? t('form.cash') : t('form.credit')}
            </span>

            {expense.cardLast4 && (
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-muted">
                {t('list.card', { last4: expense.cardLast4 })}
              </span>
            )}

            {expense.installmentsCount > 1 && (
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-muted">
                {t('list.installments', { count: expense.installmentsCount })} ·{' '}
                {formatMoney(
                  installmentAmountMinor(expense.amountMinor, expense.installmentsCount),
                  expense.currency,
                  locale,
                )}
              </span>
            )}

            {/* הפעולות נשארות יחד ונצמדות לקצה גם כשהתגיות נשברות לשורה נוספת. */}
            <div className="ms-auto flex gap-2">
              <button
                type="button"
                className="btn-ghost min-h-9 px-3 text-sm"
                onClick={() => onEdit(expense)}
              >
                {t('list.edit')}
              </button>
              <button
                type="button"
                className="btn-danger min-h-9 px-3 text-sm"
                onClick={() => onDelete(expense)}
              >
                {t('list.delete')}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
