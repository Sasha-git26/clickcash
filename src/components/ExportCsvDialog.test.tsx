import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportCsvDialog } from './ExportCsvDialog'
import { renderWithI18n } from '../test/renderWithI18n'
import { makeExpense } from '../test/factories'
import { DICTIONARIES } from '../i18n/strings'

const he = DICTIONARIES.he

const expenses = [
  makeExpense({
    id: 'old-cash',
    merchant: 'ארומה',
    paymentMethod: 'cash',
    dateTime: '2026-09-10T09:00:00+03:00',
  }),
  makeExpense({
    id: 'recent-cash',
    merchant: 'רמי לוי',
    paymentMethod: 'cash',
    dateTime: '2026-10-15T09:00:00+03:00',
  }),
  makeExpense({
    id: 'recent-credit',
    merchant: 'קסטרו',
    paymentMethod: 'credit',
    cardLast4: '2213',
    dateTime: '2026-10-20T09:00:00+03:00',
  }),
]

function setup() {
  const onExport = vi.fn()
  const onCancel = vi.fn()
  renderWithI18n(
    <ExportCsvDialog expenses={expenses} onExport={onExport} onCancel={onCancel} />,
  )
  return { onExport, onCancel, user: userEvent.setup() }
}

describe('ExportCsvDialog', () => {
  it('מייצא את הכל כברירת מחדל ומציג את מספר ההוצאות', async () => {
    const { onExport, user } = setup()

    expect(screen.getByText(he['export.count'].replace('{count}', '3'))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: he['export.action'] }))
    expect(onExport.mock.calls[0][0].map((e: { id: string }) => e.id).sort()).toEqual([
      'old-cash',
      'recent-cash',
      'recent-credit',
    ])
  })

  it('מסנן לפי טווח תאריכים', async () => {
    const { onExport, user } = setup()

    await user.type(screen.getByLabelText(he['filters.from']), '2026-10-01')
    await user.click(screen.getByRole('button', { name: he['export.action'] }))

    expect(onExport.mock.calls[0][0].map((e: { id: string }) => e.id).sort()).toEqual([
      'recent-cash',
      'recent-credit',
    ])
  })

  it('מסנן לפי אמצעי תשלום', async () => {
    const { onExport, user } = setup()

    await user.selectOptions(screen.getByLabelText(he['filters.paymentMethod']), 'credit')
    await user.click(screen.getByRole('button', { name: he['export.action'] }))

    expect(onExport.mock.calls[0][0].map((e: { id: string }) => e.id)).toEqual(['recent-credit'])
  })

  it('משלב טווח תאריכים ואמצעי תשלום', async () => {
    const { onExport, user } = setup()

    await user.type(screen.getByLabelText(he['filters.from']), '2026-10-01')
    await user.type(screen.getByLabelText(he['filters.to']), '2026-10-18')
    await user.selectOptions(screen.getByLabelText(he['filters.paymentMethod']), 'cash')
    await user.click(screen.getByRole('button', { name: he['export.action'] }))

    expect(onExport.mock.calls[0][0].map((e: { id: string }) => e.id)).toEqual(['recent-cash'])
  })

  it('חוסם ייצוא כשאין התאמות', async () => {
    const { onExport, user } = setup()

    await user.type(screen.getByLabelText(he['filters.from']), '2027-01-01')

    expect(await screen.findByText(he['export.empty'])).toBeInTheDocument()
    expect(screen.getByRole('button', { name: he['export.action'] })).toBeDisabled()
    expect(onExport).not.toHaveBeenCalled()
  })

  it('מבטל בלי לייצא', async () => {
    const { onExport, onCancel, user } = setup()

    await user.click(screen.getByRole('button', { name: he['confirm.cancel'] }))

    expect(onCancel).toHaveBeenCalled()
    expect(onExport).not.toHaveBeenCalled()
  })
})
