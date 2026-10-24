import { useRef, useState, type ChangeEvent } from 'react'
import type { Expense } from '../types/expense'
import {
  backupFilename,
  buildBackup,
  buildCsv,
  downloadTextFile,
  parseBackup,
} from '../domain/backup'
import { LANGUAGES, LANGUAGE_META, type Language } from '../i18n/strings'
import { useI18n } from '../i18n/I18nProvider'
import { ConfirmDialog } from './ConfirmDialog'
import { ExportCsvDialog } from './ExportCsvDialog'

interface DataSettingsProps {
  expenses: Expense[]
  onRestore: (expenses: Expense[]) => Promise<void>
  onNotify: (message: string, tone?: 'success' | 'error') => void
}

export function DataSettings({ expenses, onRestore, onNotify }: DataSettingsProps) {
  const { t, language, setLanguage } = useI18n()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingRestore, setPendingRestore] = useState<Expense[] | null>(null)
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState(false)

  function handleExportCsv(selected: Expense[]) {
    setExporting(false)
    downloadTextFile(backupFilename('csv'), buildCsv(selected), 'text/csv')
    onNotify(t('toast.exported'))
  }

  function handleBackupJson() {
    downloadTextFile(
      backupFilename('json'),
      `${JSON.stringify(buildBackup(expenses), null, 2)}\n`,
      'application/json',
    )
    onNotify(t('toast.exported'))
  }

  async function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // מאפסים את השדה כדי שבחירה חוזרת של אותו קובץ תפעיל את האירוע שוב.
    event.target.value = ''
    if (!file) return

    try {
      const parsed = parseBackup(await file.text())
      if (!parsed) {
        onNotify(t('errors.restoreFailed'), 'error')
        return
      }
      setPendingRestore(parsed.expenses)
    } catch {
      onNotify(t('errors.restoreFailed'), 'error')
    }
  }

  async function confirmRestore() {
    if (!pendingRestore) return
    const restored = pendingRestore
    setPendingRestore(null)
    try {
      await onRestore(restored)
      onNotify(t('toast.restored', { count: restored.length }))
    } catch {
      onNotify(t('errors.restoreFailed'), 'error')
    }
  }

  return (
    <section className="space-y-2" aria-label={t('settings.title')}>
      <button
        type="button"
        className="btn-ghost w-full justify-between"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{t('settings.title')}</span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="card space-y-4">
          <div>
            <span className="field-label">{t('settings.language')}</span>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-muted p-1">
              {LANGUAGES.map((option: Language) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={language === option}
                  className={`btn min-h-11 ${
                    language === option ? 'bg-brand text-brand-fg' : 'text-ink-muted'
                  }`}
                  onClick={() => setLanguage(option)}
                >
                  {LANGUAGE_META[option].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <button type="button" className="btn-ghost" onClick={() => setExporting(true)}>
              {t('settings.exportCsv')}
            </button>
            <button type="button" className="btn-ghost" onClick={handleBackupJson}>
              {t('settings.backupJson')}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fileInput.current?.click()}
            >
              {t('settings.restoreJson')}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileChosen}
            />
          </div>

          <div className="rounded-xl bg-surface-muted p-3">
            <h3 className="text-sm font-semibold text-ink">{t('settings.installHintTitle')}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {t('settings.installHintBody')}
            </p>
          </div>

          {/* הבהרה קבועה: אחסון מקומי אינו גיבוי בענן. */}
          <div className="rounded-xl bg-surface-muted p-3">
            <h3 className="text-sm font-semibold text-ink">{t('settings.storageNoticeTitle')}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {t('settings.storageNoticeBody')}
            </p>
          </div>
        </div>
      )}

      {exporting && (
        <ExportCsvDialog
          expenses={expenses}
          onExport={handleExportCsv}
          onCancel={() => setExporting(false)}
        />
      )}

      {pendingRestore && (
        <ConfirmDialog
          title={t('settings.restoreConfirmTitle')}
          body={t('settings.restoreConfirmBody', {
            current: expenses.length,
            incoming: pendingRestore.length,
          })}
          confirmLabel={t('settings.restoreConfirmAction')}
          cancelLabel={t('confirm.cancel')}
          onConfirm={confirmRestore}
          onCancel={() => setPendingRestore(null)}
        />
      )}
    </section>
  )
}
