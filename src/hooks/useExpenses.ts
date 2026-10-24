import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExpenseRepository } from '../data/ExpenseRepository'
import type { Expense, ExpenseInput } from '../types/expense'

function sortNewestFirst(expenses: Expense[]): Expense[] {
  return [...expenses].sort(
    (a, b) =>
      Date.parse(b.dateTime) - Date.parse(a.dateTime) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )
}

export interface UseExpensesResult {
  expenses: Expense[]
  loading: boolean
  loadError: boolean
  addExpense: (input: ExpenseInput) => Promise<Expense>
  updateExpense: (id: string, patch: Partial<ExpenseInput>) => Promise<Expense>
  removeExpense: (id: string) => Promise<void>
  restoreAll: (expenses: Expense[]) => Promise<void>
}

/**
 * מחזיק את כל ההוצאות ב-state ומנתב כל שינוי דרך ה-repository.
 * ההוצאות נטענות פעם אחת בעלייה; הסינון, המיון והסיכומים מחושבים
 * מהרשימה הזו בפונקציות טהורות — מהיר ופשוט בהיקפים של אפליקציה אישית.
 */
export function useExpenses(repository: ExpenseRepository): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    repository
      .list()
      .then((loaded) => {
        if (cancelled) return
        setExpenses(sortNewestFirst(loaded))
        setLoadError(false)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [repository])

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      const created = await repository.add(input)
      if (mounted.current) setExpenses((current) => sortNewestFirst([created, ...current]))
      return created
    },
    [repository],
  )

  const updateExpense = useCallback(
    async (id: string, patch: Partial<ExpenseInput>) => {
      const updated = await repository.update(id, patch)
      if (mounted.current) {
        setExpenses((current) =>
          sortNewestFirst(current.map((expense) => (expense.id === id ? updated : expense))),
        )
      }
      return updated
    },
    [repository],
  )

  const removeExpense = useCallback(
    async (id: string) => {
      await repository.remove(id)
      if (mounted.current) {
        setExpenses((current) => current.filter((expense) => expense.id !== id))
      }
    },
    [repository],
  )

  const restoreAll = useCallback(
    async (restored: Expense[]) => {
      await repository.replaceAll(restored)
      if (mounted.current) setExpenses(sortNewestFirst(restored))
    },
    [repository],
  )

  return { expenses, loading, loadError, addExpense, updateExpense, removeExpense, restoreAll }
}
