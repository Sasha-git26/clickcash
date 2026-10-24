import { useCallback, useEffect, useRef, useState } from 'react'

export interface ToastState {
  id: number
  message: string
  tone: 'success' | 'error'
}

const TOAST_DURATION_MS = 2600

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextId = useRef(0)

  const clear = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
    setToast(null)
  }, [])

  const showToast = useCallback((message: string, tone: ToastState['tone'] = 'success') => {
    if (timer.current !== null) clearTimeout(timer.current)
    nextId.current += 1
    setToast({ id: nextId.current, message, tone })
    timer.current = setTimeout(() => {
      timer.current = null
      setToast(null)
    }, TOAST_DURATION_MS)
  }, [])

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  return { toast, showToast, clearToast: clear }
}
