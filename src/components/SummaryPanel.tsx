import type { CurrencyTotals } from '../domain/summaries'
import { CURRENCY_SYMBOLS, formatMoney } from '../domain/money'
import { useI18n } from '../i18n/I18nProvider'

interface SummaryPanelProps {
  totals: CurrencyTotals[]
}

export function SummaryPanel({ totals }: SummaryPanelProps) {
  const { t, locale } = useI18n()

  return (
    <section className="space-y-2" aria-label={t('summary.title')}>
      <h2 className="section-title">{t('summary.title')}</h2>

      {totals.length === 0 ? (
        <p className="card text-center text-ink-muted">{t('summary.empty')}</p>
      ) : (
        <>
          {totals.map((group) => (
            <div key={group.currency} className="card">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="font-semibold text-ink">
                  {CURRENCY_SYMBOLS[group.currency]} {group.currency}
                </h3>
                <span className="text-sm text-ink-muted">
                  {t('list.resultCount', { count: group.count })}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['summary.today', group.today],
                    ['summary.month', group.thisMonth],
                    ['summary.cash', group.cash],
                    ['summary.credit', group.credit],
                  ] as const
                ).map(([labelKey, value]) => (
                  <div key={labelKey} className="rounded-xl bg-surface-muted px-3 py-2">
                    <dt className="text-xs text-ink-muted">{t(labelKey)}</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                      {formatMoney(value, group.currency, locale)}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-sm text-ink-muted">{t('summary.total')}</span>
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {formatMoney(group.all, group.currency, locale)}
                </span>
              </div>
            </div>
          ))}

          {/* הבהרה מפורשת: אין המרת מטבע, ולכן אין סכום-על מאוחד. */}
          <p className="px-1 text-xs leading-relaxed text-ink-muted">
            {t('summary.perCurrencyNote')}
          </p>
        </>
      )}
    </section>
  )
}
