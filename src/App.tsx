import { useCallback, useMemo, useState } from 'react'
import type { Currency, Expense, ExpenseInput } from './types/expense'
import { expenseRepository } from './data/idbExpenseRepository'
import {
  loadKnownCards,
  loadLanguage,
  loadLastCurrency,
  loadStorageNoticeDismissed,
  rememberCard,
  saveLanguage,
  saveLastCurrency,
  saveStorageNoticeDismissed,
} from './data/preferences'
import {
  applyFilters,
  collectDescriptionSuggestions,
  collectMerchantSuggestions,
  DEFAULT_FILTERS,
  hasActiveFilters,
} from './domain/filters'
import { summarizeByCurrency } from './domain/summaries'
import { formatMoney } from './domain/money'
import { useExpenses } from './hooks/useExpenses'
import { useToast } from './hooks/useToast'
import { I18nProvider, useI18n } from './i18n/I18nProvider'
import type { Language } from './i18n/strings'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseFiltersBar } from './components/ExpenseFiltersBar'
import { ExpenseList } from './components/ExpenseList'
import { SummaryPanel } from './components/SummaryPanel'
import { EditExpenseSheet } from './components/EditExpenseSheet'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DataSettings } from './components/DataSettings'
import { Toast } from './components/Toast'

function AppShell() {
  const { t, locale } = useI18n()
  const { expenses, loading, loadError, addExpense, updateExpense, removeExpense, restoreAll } =
    useExpenses(expenseRepository)
  const { toast, showToast } = useToast()

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [lastCurrency, setLastCurrency] = useState<Currency>(loadLastCurrency)
  const [knownCards, setKnownCards] = useState<string[]>(loadKnownCards)
  const [noticeDismissed, setNoticeDismissed] = useState(loadStorageNoticeDismissed)

  const visibleExpenses = useMemo(() => applyFilters(expenses, filters), [expenses, filters])
  // הסיכומים מחושבים מכלל ההוצאות ולא מהרשימה המסוננת.
  const totals = useMemo(() => summarizeByCurrency(expenses), [expenses])
  const suggestions = useMemo(() => collectDescriptionSuggestions(expenses), [expenses])
  const merchantSuggestions = useMemo(() => collectMerchantSuggestions(expenses), [expenses])
  const filtersActive = hasActiveFilters(filters)

  const handleCurrencyChange = useCallback((currency: Currency) => {
    setLastCurrency(currency)
    saveLastCurrency(currency)
  }, [])

  // כל כרטיס שנשמר בהוצאה נזכר להבא ועולה לראש רשימת ההצעות.
  const handleCardUsed = useCallback((card: string | undefined) => {
    if (card) setKnownCards(rememberCard(card))
  }, [])

  const handleAdd = useCallback(
    async (input: ExpenseInput) => {
      try {
        await addExpense(input)
        handleCurrencyChange(input.currency)
        handleCardUsed(input.cardLast4)
        showToast(t('toast.added'))
        return true
      } catch {
        showToast(t('errors.saveFailed'), 'error')
        return false
      }
    },
    [addExpense, handleCardUsed, handleCurrencyChange, showToast, t],
  )

  const handleSaveEdit = useCallback(
    async (id: string, input: ExpenseInput) => {
      try {
        // השדות האופציונליים נשלחים במפורש (גם כ-undefined) כדי שניקוי שלהם
        // בעריכה אכן יימחק מהרשומה ולא ייפול חזרה לערך הקודם.
        await updateExpense(id, {
          ...input,
          description: input.description,
          cardLast4: input.cardLast4,
        })
        handleCardUsed(input.cardLast4)
        showToast(t('toast.updated'))
        return true
      } catch {
        showToast(t('errors.saveFailed'), 'error')
        return false
      }
    },
    [handleCardUsed, showToast, t, updateExpense],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return
    const target = deleting
    setDeleting(null)
    try {
      await removeExpense(target.id)
      showToast(t('toast.deleted'))
    } catch {
      showToast(t('errors.saveFailed'), 'error')
    }
  }, [deleting, removeExpense, showToast, t])

  function dismissNotice() {
    setNoticeDismissed(true)
    saveStorageNoticeDismissed()
  }

  return (
    <div className="min-h-dvh pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-16">
        <header className="pt-4">
          <h1 className="text-2xl font-bold text-ink">{t('app.title')}</h1>
          <p className="text-sm text-ink-muted">{t('app.subtitle')}</p>
        </header>

        {/* הבהרת אחסון מקומי, פעם אחת, לפני השימוש הראשון. */}
        {!noticeDismissed && (
          <div className="card border-brand/40 bg-brand-soft">
            <h2 className="text-sm font-semibold text-brand-soft-fg">
              {t('settings.storageNoticeTitle')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-brand-soft-fg">
              {t('settings.storageNoticeBody')}
            </p>
            <button
              type="button"
              className="btn-ghost mt-3 min-h-10 px-3 text-sm"
              onClick={dismissNotice}
            >
              {t('settings.dismiss')}
            </button>
          </div>
        )}

        {/* טופס ההוספה ראשון — אין צורך לגלול כדי לרשום הוצאה. */}
        <ExpenseForm
          initialCurrency={lastCurrency}
          descriptionSuggestions={suggestions}
          merchantSuggestions={merchantSuggestions}
          knownCards={knownCards}
          onSubmit={handleAdd}
          onCurrencyChange={handleCurrencyChange}
        />

        {loadError && (
          <p className="card text-center text-danger" role="alert">
            {t('errors.loadFailed')}
          </p>
        )}

        {/* ה-aria-label של הרשימה עצמה מגיע מ-ExpenseList, כדי שלא יהיו שני
            אלמנטים עם אותו שם נגיש. */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">{t('list.title')}</h2>
            <span className="text-sm text-ink-muted">
              {t('list.resultCount', { count: visibleExpenses.length })}
            </span>
          </div>

          <ExpenseFiltersBar
            filters={filters}
            resultCount={visibleExpenses.length}
            onChange={setFilters}
          />

          {loading ? (
            <p className="card text-center text-ink-muted">{t('common.loading')}</p>
          ) : (
            <ExpenseList
              expenses={visibleExpenses}
              filtered={filtersActive}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          )}
        </section>

        <SummaryPanel totals={totals} />

        <DataSettings expenses={expenses} onRestore={restoreAll} onNotify={showToast} />
      </div>

      {editing && (
        <EditExpenseSheet
          expense={editing}
          descriptionSuggestions={suggestions}
          merchantSuggestions={merchantSuggestions}
          knownCards={knownCards}
          onSave={handleSaveEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t('confirm.deleteTitle')}
          body={t('confirm.deleteBody', {
            description: deleting.description ?? deleting.merchant,
            amount: formatMoney(deleting.amountMinor, deleting.currency, locale),
          })}
          confirmLabel={t('confirm.delete')}
          cancelLabel={t('confirm.cancel')}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}

export default function App() {
  const [language, setLanguageState] = useState<Language>(loadLanguage)

  const handleLanguageChange = useCallback((next: Language) => {
    setLanguageState(next)
    saveLanguage(next)
  }, [])

  return (
    <I18nProvider language={language} onLanguageChange={handleLanguageChange}>
      <AppShell />
    </I18nProvider>
  )
}
