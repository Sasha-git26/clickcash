import type { Expense, ExpenseFormValues, ExpenseInput } from '../types/expense'

let counter = 0

export function makeExpense(overrides: Partial<Expense> = {}): Expense {
  counter += 1
  const dateTime = overrides.dateTime ?? '2026-10-23T12:00:00+03:00'
  return {
    id: `expense-${counter}`,
    amountMinor: 1000,
    currency: 'ILS',
    merchant: 'רמי לוי',
    paymentMethod: 'cash',
    installmentsCount: 1,
    dateTime,
    createdAt: dateTime,
    updatedAt: dateTime,
    syncStatus: 'local',
    ...overrides,
  }
}

export function makeInput(overrides: Partial<ExpenseInput> = {}): ExpenseInput {
  return {
    amountMinor: 2550,
    currency: 'ILS',
    merchant: 'פז',
    paymentMethod: 'cash',
    installmentsCount: 1,
    dateTime: '2026-10-23T12:00:00+03:00',
    ...overrides,
  }
}

export function makeFormValues(overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues {
  return {
    amount: '25.50',
    currency: 'ILS',
    merchant: 'פז',
    description: '',
    paymentMethod: 'cash',
    cardLast4: '2213',
    installmentsCount: 1,
    dateTime: '',
    ...overrides,
  }
}
