import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseList } from './ExpenseList'
import { renderWithI18n } from '../test/renderWithI18n'
import { makeExpense } from '../test/factories'
import { toLocalIsoString } from '../domain/datetime'
import { DICTIONARIES } from '../i18n/strings'

const he = DICTIONARIES.he

describe('ExpenseList', () => {
  it('מציג הודעה כשאין הוצאות', () => {
    renderWithI18n(
      <ExpenseList expenses={[]} filtered={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )
    expect(screen.getByText(he['list.empty'])).toBeInTheDocument()
  })

  it('מציג הודעה אחרת כשהסינון הוא שמרוקן את הרשימה', () => {
    renderWithI18n(<ExpenseList expenses={[]} filtered onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(he['list.emptyFiltered'])).toBeInTheDocument()
  })

  it('מציג שם חנות, סכום, מטבע, תאריך ואמצעי תשלום', () => {
    renderWithI18n(
      <ExpenseList
        expenses={[
          makeExpense({
            merchant: 'רמי לוי',
            amountMinor: 12345,
            currency: 'ILS',
            // נבנה מתאריך מקומי כדי שהבדיקה לא תהיה תלויה באזור הזמן של המכונה.
            dateTime: toLocalIsoString(new Date(2026, 9, 23, 14, 5)),
          }),
        ]}
        filtered={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('רמי לוי')).toBeInTheDocument()
    expect(screen.getByText(/123\.45/)).toBeInTheDocument()
    expect(screen.getByText(/23\.10\.2026/)).toBeInTheDocument()
    expect(screen.getByText(/14:05/)).toBeInTheDocument()
    expect(screen.getByText(he['form.cash'])).toBeInTheDocument()
  })

  it('מציג את הפירוט מתחת לשם החנות, ומשמיט אותו כשאינו קיים', () => {
    const withDescription = renderWithI18n(
      <ExpenseList
        expenses={[makeExpense({ merchant: 'רמי לוי', description: 'סופרמרקט' })]}
        filtered={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('רמי לוי')).toBeInTheDocument()
    expect(screen.getByText('סופרמרקט')).toBeInTheDocument()
    withDescription.unmount()

    renderWithI18n(
      <ExpenseList
        expenses={[makeExpense({ merchant: 'רמי לוי' })]}
        filtered={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('רמי לוי')).toBeInTheDocument()
    expect(screen.queryByText('סופרמרקט')).not.toBeInTheDocument()
  })

  it('מציג ארבע ספרות ומספר תשלומים בהוצאת אשראי', () => {
    renderWithI18n(
      <ExpenseList
        expenses={[
          makeExpense({
            amountMinor: 120000,
            paymentMethod: 'credit',
            cardLast4: '4321',
            installmentsCount: 6,
          }),
        ]}
        filtered={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText(/4321/)).toBeInTheDocument()
    expect(screen.getByText(/6 תשלומים/)).toBeInTheDocument()
  })

  it('לא מציג תגית תשלומים בתשלום בודד', () => {
    renderWithI18n(
      <ExpenseList
        expenses={[makeExpense({ paymentMethod: 'credit', cardLast4: '4321' })]}
        filtered={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.queryByText(/תשלומים/)).not.toBeInTheDocument()
  })

  it('מעביר את ההוצאה הנכונה לעריכה ולמחיקה', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const first = makeExpense({ merchant: 'ארומה' })
    const second = makeExpense({ merchant: 'פז' })

    renderWithI18n(
      <ExpenseList
        expenses={[first, second]}
        filtered={false}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )

    await user.click(screen.getAllByRole('button', { name: he['list.edit'] })[1])
    expect(onEdit).toHaveBeenCalledWith(second)

    await user.click(screen.getAllByRole('button', { name: he['list.delete'] })[0])
    expect(onDelete).toHaveBeenCalledWith(first)
  })
})
