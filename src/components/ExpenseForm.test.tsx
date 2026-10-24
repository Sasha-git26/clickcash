import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseForm } from './ExpenseForm'
import { renderWithI18n } from '../test/renderWithI18n'
import { DICTIONARIES } from '../i18n/strings'

const he = DICTIONARIES.he

function setup(onSubmit = vi.fn().mockResolvedValue(true), knownCards: string[] = []) {
  const onCurrencyChange = vi.fn()
  renderWithI18n(
    <ExpenseForm
      initialCurrency="ILS"
      descriptionSuggestions={['קפה', 'סופרמרקט']}
      merchantSuggestions={['רמי לוי', 'פז', 'ארומה']}
      knownCards={knownCards}
      onSubmit={onSubmit}
      onCurrencyChange={onCurrencyChange}
    />,
  )
  return { onSubmit, onCurrencyChange, user: userEvent.setup() }
}

describe('ExpenseForm', () => {
  it('מציג כברירת מחדל מזומן, ללא שדות אשראי', () => {
    setup()

    expect(screen.getByRole('button', { name: he['form.cash'] })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.queryByLabelText(he['form.cardLast4'])).not.toBeInTheDocument()
    expect(screen.queryByLabelText(he['form.installments'])).not.toBeInTheDocument()
  })

  it('מציג את שם החנות לפני הפירוט', () => {
    setup()

    const merchant = screen.getByLabelText(he['form.merchant'])
    const description = screen.getByLabelText(he['form.description'])

    // DOCUMENT_POSITION_FOLLOWING = הפירוט מופיע אחרי שם החנות ב-DOM.
    expect(merchant.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('שומר הוצאה במזומן ומנקה את השדות', async () => {
    const { onSubmit, user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '25.5')
    await user.type(screen.getByLabelText(he['form.merchant']), 'פז')
    await user.type(screen.getByLabelText(he['form.description']), 'דלק 95')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amountMinor: 2550,
        currency: 'ILS',
        merchant: 'פז',
        description: 'דלק 95',
        paymentMethod: 'cash',
        installmentsCount: 1,
      }),
    )

    await waitFor(() => expect(screen.getByLabelText(he['form.amount'])).toHaveValue(''))
    expect(screen.getByLabelText(he['form.merchant'])).toHaveValue('')
    expect(screen.getByLabelText(he['form.description'])).toHaveValue('')
  })

  it('הפירוט אינו חובה', async () => {
    const { onSubmit, user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '12')
    await user.type(screen.getByLabelText(he['form.merchant']), 'חניון דיזנגוף')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].merchant).toBe('חניון דיזנגוף')
    expect(onSubmit.mock.calls[0][0].description).toBeUndefined()
  })

  it('חותם תאריך ושעה אוטומטית', async () => {
    const { onSubmit, user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '10')
    await user.type(screen.getByLabelText(he['form.merchant']), 'ארומה')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const { dateTime } = onSubmit.mock.calls[0][0]
    expect(Number.isNaN(Date.parse(dateTime))).toBe(false)
  })

  it('מציג שגיאות ולא שומר כשהסכום ושם החנות ריקים', async () => {
    const { onSubmit, user } = setup()

    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    expect(await screen.findByText(he['errors.amountRequired'])).toBeInTheDocument()
    expect(screen.getByText(he['errors.merchantRequired'])).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('לא שומר כשהוזן סכום בלבד ללא שם חנות', async () => {
    const { onSubmit, user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '30')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    expect(await screen.findByText(he['errors.merchantRequired'])).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('מציג שדות אשראי רק בבחירת אשראי ומסתיר אותם בחזרה למזומן', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    expect(screen.getByLabelText(he['form.cardLast4'])).toBeInTheDocument()
    expect(screen.getByLabelText(he['form.installments'])).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: he['form.cash'] }))
    expect(screen.queryByLabelText(he['form.cardLast4'])).not.toBeInTheDocument()
  })

  it('מתחיל עם שדה כרטיס ריק כשאין כרטיסים קודמים', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: he['form.credit'] }))

    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('')
  })

  it('דורש ארבע ספרות בכרטיס לפני שמירת הוצאת אשראי', async () => {
    const { onSubmit, user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '80')
    await user.type(screen.getByLabelText(he['form.merchant']), 'קסטרו')
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.type(screen.getByLabelText(he['form.cardLast4']), '12')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    expect(await screen.findByText(he['errors.cardLast4Invalid'])).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('מקבל ספרות בלבד, עד ארבע', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.type(screen.getByLabelText(he['form.cardLast4']), 'a1b2c3d4e5')

    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('1234')
  })

  it('שומר את הכרטיס שהוקלד', async () => {
    const { onSubmit, user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '120')
    await user.type(screen.getByLabelText(he['form.merchant']), 'קסטרו')
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.type(screen.getByLabelText(he['form.cardLast4']), '0921')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].cardLast4).toBe('0921')
  })

  it('מציג את כל הכרטיסים הקודמים ברשימה, עם האחרון כברירת מחדל', async () => {
    const { user } = setup(vi.fn().mockResolvedValue(true), ['0921', '2213'])

    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    const cardField = screen.getByLabelText(he['form.cardLast4'])

    expect(cardField).toHaveValue('0921')
    expect([...(cardField as HTMLSelectElement).options].map((option) => option.text)).toEqual([
      '0921',
      '2213',
      he['form.cardNew'],
    ])
  })

  it('שומר כרטיס שנבחר מהרשימה', async () => {
    const { onSubmit, user } = setup(vi.fn().mockResolvedValue(true), ['0921', '2213'])

    await user.type(screen.getByLabelText(he['form.amount']), '90')
    await user.type(screen.getByLabelText(he['form.merchant']), 'קסטרו')
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.selectOptions(screen.getByLabelText(he['form.cardLast4']), '2213')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].cardLast4).toBe('2213')
  })

  it('מאפשר להוסיף כרטיס חדש מתוך הרשימה', async () => {
    const { onSubmit, user } = setup(vi.fn().mockResolvedValue(true), ['0921'])

    await user.type(screen.getByLabelText(he['form.amount']), '45')
    await user.type(screen.getByLabelText(he['form.merchant']), 'ארומה')
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.selectOptions(screen.getByLabelText(he['form.cardLast4']), he['form.cardNew'])

    // השדה מתחלף להקלדה ומתרוקן, כדי שיוזנו ארבע ספרות חדשות.
    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('')

    await user.type(screen.getByLabelText(he['form.cardLast4']), '4455')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].cardLast4).toBe('4455')
  })

  it('חוזר לרשימה בביטול הוספת כרטיס חדש', async () => {
    const { user } = setup(vi.fn().mockResolvedValue(true), ['0921', '2213'])

    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.selectOptions(screen.getByLabelText(he['form.cardLast4']), he['form.cardNew'])
    await user.click(screen.getByRole('button', { name: he['form.cancel'] }))

    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('0921')
  })

  it('משאיר את הכרטיס האחרון שהוקלד כברירת מחדל לאחר שמירה', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '60')
    await user.type(screen.getByLabelText(he['form.merchant']), 'קסטרו')
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.type(screen.getByLabelText(he['form.cardLast4']), '0921')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(screen.getByLabelText(he['form.amount'])).toHaveValue(''))
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('0921')
  })

  it('שומר הוצאת אשראי עם תשלומים ומציג את סכום התשלום המשוער', async () => {
    const { onSubmit, user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '1200')
    await user.type(screen.getByLabelText(he['form.merchant']), 'אלקטרו דיל')
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.type(screen.getByLabelText(he['form.cardLast4']), '2213')
    await user.selectOptions(screen.getByLabelText(he['form.installments']), '6')

    // 1200 ל-6 תשלומים = 200 לתשלום.
    expect(screen.getByText(/200/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amountMinor: 120000,
        paymentMethod: 'credit',
        cardLast4: '2213',
        installmentsCount: 6,
      }),
    )
  })

  it('חוזר לברירת המחדל מזומן לאחר שמירת הוצאת אשראי', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText(he['form.amount']), '50')
    await user.type(screen.getByLabelText(he['form.merchant']), 'מסעדה')
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    await user.type(screen.getByLabelText(he['form.cardLast4']), '2213')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: he['form.cash'] })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
    expect(screen.queryByLabelText(he['form.cardLast4'])).not.toBeInTheDocument()
  })

  it('שומר את המטבע שנבחר גם לאחר שמירה', async () => {
    const { onCurrencyChange, user } = setup()

    await user.selectOptions(screen.getByLabelText(he['form.currency']), 'USD')
    expect(onCurrencyChange).toHaveBeenCalledWith('USD')

    await user.type(screen.getByLabelText(he['form.amount']), '15')
    await user.type(screen.getByLabelText(he['form.merchant']), 'Starbucks')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() => expect(screen.getByLabelText(he['form.amount'])).toHaveValue(''))
    expect(screen.getByLabelText(he['form.currency'])).toHaveValue('USD')
  })

  it('מונע הוספה כפולה בלחיצה חוזרת', async () => {
    let resolveSubmit: ((value: boolean) => void) | undefined
    const onSubmit = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    const { user } = setup(onSubmit)

    await user.type(screen.getByLabelText(he['form.amount']), '10')
    await user.type(screen.getByLabelText(he['form.merchant']), 'ארומה')

    const addButton = screen.getByRole('button', { name: he['form.add'] })
    await user.click(addButton)

    // בזמן השמירה הכפתור חסום וכל לחיצה נוספת אינה מפעילה שמירה שנייה.
    const pendingButton = screen.getByRole('button', { name: he['form.adding'] })
    expect(pendingButton).toBeDisabled()
    await user.click(pendingButton)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    resolveSubmit?.(true)
    await waitFor(() => expect(screen.getByLabelText(he['form.amount'])).toHaveValue(''))
  })

  it('לא מנקה את הטופס כשהשמירה נכשלת', async () => {
    const { user } = setup(vi.fn().mockResolvedValue(false))

    await user.type(screen.getByLabelText(he['form.amount']), '33')
    await user.type(screen.getByLabelText(he['form.merchant']), 'חברת חשמל')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: he['form.add'] })).not.toBeDisabled(),
    )
    expect(screen.getByLabelText(he['form.amount'])).toHaveValue('33')
    expect(screen.getByLabelText(he['form.merchant'])).toHaveValue('חברת חשמל')
  })

  it('מציע השלמה אוטומטית לשני שדות הטקסט, מרשימות נפרדות', () => {
    setup()

    const merchantListId = screen.getByLabelText(he['form.merchant']).getAttribute('list')
    const descriptionListId = screen.getByLabelText(he['form.description']).getAttribute('list')

    expect(merchantListId).toBeTruthy()
    expect(descriptionListId).toBeTruthy()
    expect(merchantListId).not.toBe(descriptionListId)
    expect(
      document.getElementById(merchantListId as string)?.querySelectorAll('option'),
    ).toHaveLength(3)
    expect(
      document.getElementById(descriptionListId as string)?.querySelectorAll('option'),
    ).toHaveLength(2)
  })
})
