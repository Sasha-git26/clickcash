import { useId, useState } from 'react'
import { CURRENCIES, PAYMENT_METHODS, type Currency, type PaymentMethod } from '../types/expense'
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  type ExpenseFilters,
  type SortDirection,
  type SortField,
} from '../domain/filters'
import { CURRENCY_SYMBOLS } from '../domain/money'
import { useI18n } from '../i18n/I18nProvider'

interface ExpenseFiltersBarProps {
  filters: ExpenseFilters
  resultCount: number
  onChange: (filters: ExpenseFilters) => void
}

export function ExpenseFiltersBar({ filters, resultCount, onChange }: ExpenseFiltersBarProps) {
  const { t } = useI18n()
  const idPrefix = useId()
  // האזור נפתח לפי דרישה כדי שהטופס והרשימה יישארו בראש המסך.
  const [expanded, setExpanded] = useState(false)
  const active = hasActiveFilters(filters)

  function set<K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <section className="card space-y-3" aria-label={t('filters.title')}>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`${idPrefix}-search`}>
          {t('filters.search')}
        </label>
        <input
          id={`${idPrefix}-search`}
          type="search"
          className="field-input flex-1"
          placeholder={t('filters.searchPlaceholder')}
          value={filters.search}
          onChange={(event) => set('search', event.target.value)}
        />
        <button
          type="button"
          className={`btn-ghost min-h-11 px-3 text-sm ${active ? 'border-brand text-brand' : ''}`}
          aria-expanded={expanded}
          aria-controls={`${idPrefix}-panel`}
          onClick={() => setExpanded((current) => !current)}
        >
          {t('filters.title')}
        </button>
      </div>

      {expanded && (
        <div id={`${idPrefix}-panel`} className="space-y-3 border-t border-line pt-3">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <label className="field-label" htmlFor={`${idPrefix}-from`}>
                {t('filters.from')}
              </label>
              <input
                id={`${idPrefix}-from`}
                type="date"
                className="field-input"
                value={filters.from}
                onChange={(event) => set('from', event.target.value)}
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
                value={filters.to}
                onChange={(event) => set('to', event.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <label className="field-label" htmlFor={`${idPrefix}-currency`}>
                {t('filters.currency')}
              </label>
              <select
                id={`${idPrefix}-currency`}
                className="field-input"
                value={filters.currency}
                onChange={(event) => set('currency', event.target.value as Currency | 'all')}
              >
                <option value="all">{t('filters.all')}</option>
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {CURRENCY_SYMBOLS[currency]} {currency}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 flex-1">
              <label className="field-label" htmlFor={`${idPrefix}-method`}>
                {t('filters.paymentMethod')}
              </label>
              <select
                id={`${idPrefix}-method`}
                className="field-input"
                value={filters.paymentMethod}
                onChange={(event) =>
                  set('paymentMethod', event.target.value as PaymentMethod | 'all')
                }
              >
                <option value="all">{t('filters.all')}</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === 'cash' ? t('form.cash') : t('form.credit')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <label className="field-label" htmlFor={`${idPrefix}-sort`}>
                {t('filters.sortField')}
              </label>
              <select
                id={`${idPrefix}-sort`}
                className="field-input"
                value={filters.sortField}
                onChange={(event) => set('sortField', event.target.value as SortField)}
              >
                <option value="dateTime">{t('filters.sortByDate')}</option>
                <option value="amount">{t('filters.sortByAmount')}</option>
              </select>
            </div>
            <div className="min-w-0 flex-1">
              <label className="field-label" htmlFor={`${idPrefix}-direction`}>
                {t('filters.sortDirection')}
              </label>
              <select
                id={`${idPrefix}-direction`}
                className="field-input"
                value={filters.sortDirection}
                onChange={(event) => set('sortDirection', event.target.value as SortDirection)}
              >
                <option value="desc">{t('filters.desc')}</option>
                <option value="asc">{t('filters.asc')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">
              {t('list.resultCount', { count: resultCount })}
            </span>
            <button
              type="button"
              className="btn-ghost min-h-10 px-3 text-sm"
              disabled={!active}
              onClick={() => onChange(DEFAULT_FILTERS)}
            >
              {t('filters.clear')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
