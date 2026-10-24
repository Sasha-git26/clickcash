import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // הפוקוס מתחיל על "ביטול" — פעולה הרסנית לא צריכה להיות לחיצת Enter אחת.
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <p id="confirm-body" className="mt-2 text-sm leading-relaxed text-ink-muted">
          {body}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className={tone === 'danger' ? 'btn-danger flex-1' : 'btn-primary flex-1'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" ref={cancelRef} className="btn-ghost flex-1" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
