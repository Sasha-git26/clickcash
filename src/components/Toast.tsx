import type { ToastState } from '../hooks/useToast'

interface ToastProps {
  toast: ToastState | null
}

export function Toast({ toast }: ToastProps) {
  return (
    // role="status" מודיע על ההצלחה לקוראי מסך בלי לחסום את המשך ההזנה.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {toast && (
        <p
          key={toast.id}
          className={`rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.tone === 'error' ? 'bg-danger text-surface' : 'bg-brand text-brand-fg'
          }`}
        >
          {toast.message}
        </p>
      )}
    </div>
  )
}
