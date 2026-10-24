import type { Expense, ExpenseInput } from '../types/expense'

/**
 * נקודת ההפרדה בין ה-UI לאחסון.
 *
 * כל גישה לנתונים באפליקציה עוברת דרך הממשק הזה, כך שהוספת Backend ב-C#
 * תתבצע על ידי מימוש נוסף (למשל ApiExpenseRepository) ללא שינוי בקומפוננטות.
 */
export interface ExpenseRepository {
  /** כל ההוצאות, מהחדשה לישנה. */
  list(): Promise<Expense[]>
  get(id: string): Promise<Expense | undefined>
  add(input: ExpenseInput): Promise<Expense>
  update(id: string, patch: Partial<ExpenseInput>): Promise<Expense>
  remove(id: string): Promise<void>
  /** דריסת כל הנתונים — משמש בשחזור מגיבוי. */
  replaceAll(expenses: Expense[]): Promise<void>
}
