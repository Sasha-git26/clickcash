import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import App from './App'
import { resetDbConnection } from './data/db'
import { PREFERENCE_KEYS } from './data/preferences'
import { DICTIONARIES } from './i18n/strings'

const he = DICTIONARIES.he

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  resetDbConnection()
  localStorage.clear()
  // הבדיקות נכתבו מול המחרוזות בעברית; ברירת המחדל של האפליקציה היא אנגלית.
  localStorage.setItem(PREFERENCE_KEYS.language, 'he')
})

/** הרשימה בלבד — כדי שסכומים בסיכומים לא יתנגשו עם סכומים בשורות. */
function expenseList() {
  return screen.getByRole('list', { name: he['list.title'] })
}

async function addExpense(
  user: ReturnType<typeof userEvent.setup>,
  amount: string,
  merchant: string,
  description?: string,
) {
  await user.type(screen.getByLabelText(he['form.amount']), amount)
  await user.type(screen.getByLabelText(he['form.merchant']), merchant)
  if (description) {
    await user.type(screen.getByLabelText(he['form.description']), description)
  }
  await user.click(screen.getByRole('button', { name: he['form.add'] }))
  await waitFor(() => expect(within(expenseList()).getByText(merchant)).toBeInTheDocument())
}

describe('App', () => {
  it('מוסיף הוצאה, מציג אותה ברשימה ומעדכן את הסיכומים', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())

    await addExpense(user, '25.50', 'פז', 'דלק 95')

    expect(screen.getByText(he['toast.added'])).toBeInTheDocument()
    expect(within(expenseList()).getByText('דלק 95')).toBeInTheDocument()

    const summary = screen.getByLabelText(he['summary.title'])
    expect(within(summary).getByText(/ILS/)).toBeInTheDocument()
    expect(within(summary).getAllByText(/25\.50/).length).toBeGreaterThan(0)
  })

  it('מוסיף הוצאה גם ללא פירוט', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())
    await addExpense(user, '12', 'חניון דיזנגוף')

    expect(within(expenseList()).getByText('חניון דיזנגוף')).toBeInTheDocument()
  })

  it('לא שומר ללא שם חנות', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())

    await user.type(screen.getByLabelText(he['form.amount']), '40')
    await user.type(screen.getByLabelText(he['form.description']), 'בלי חנות')
    await user.click(screen.getByRole('button', { name: he['form.add'] }))

    expect(await screen.findByText(he['errors.merchantRequired'])).toBeInTheDocument()
    expect(screen.getByText(he['list.empty'])).toBeInTheDocument()
  })

  it('שומר את ההוצאות בין טעינות של האפליקציה', async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())
    await addExpense(user, '40', 'מסעדה')

    // סימולציה של סגירת האפליקציה ופתיחתה מחדש, עם אותו מסד IndexedDB.
    first.unmount()
    resetDbConnection()
    render(<App />)

    expect(await screen.findByText('מסעדה')).toBeInTheDocument()
  })

  it('עורך הוצאה קיימת', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())
    await addExpense(user, '10', 'ארומה')

    await user.click(screen.getByRole('button', { name: he['list.edit'] }))

    const sheet = screen.getByRole('dialog', { name: he['edit.title'] })
    const amountField = within(sheet).getByLabelText(he['form.amount'])
    await user.clear(amountField)
    await user.type(amountField, '18')
    await user.click(within(sheet).getByRole('button', { name: he['form.save'] }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: he['edit.title'] })).not.toBeInTheDocument(),
    )
    expect(screen.getByText(he['toast.updated'])).toBeInTheDocument()
    expect(within(expenseList()).getByText(/18\.00/)).toBeInTheDocument()
  })

  it('לא מזיז הוצאה לעכשיו כששדה התאריך רוקן בעריכה', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())
    await addExpense(user, '10', 'ארומה')

    await user.click(screen.getByRole('button', { name: he['list.edit'] }))
    const sheet = screen.getByRole('dialog', { name: he['edit.title'] })
    await user.clear(within(sheet).getByLabelText(he['form.dateTime']))
    await user.click(within(sheet).getByRole('button', { name: he['form.save'] }))

    expect(await within(sheet).findByText(he['errors.dateTimeRequired'])).toBeInTheDocument()
    // החלון נשאר פתוח: ההוצאה לא נשמרה עם חותמת זמן חדשה.
    expect(screen.getByRole('dialog', { name: he['edit.title'] })).toBeInTheDocument()
    expect(screen.queryByText(he['toast.updated'])).not.toBeInTheDocument()
  })

  it('מוחק הוצאה רק לאחר אישור', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())
    await addExpense(user, '12', 'חניון')

    // ביטול משאיר את ההוצאה במקומה.
    await user.click(screen.getByRole('button', { name: he['list.delete'] }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: he['confirm.cancel'] }),
    )
    expect(within(expenseList()).getByText('חניון')).toBeInTheDocument()

    // אישור מוחק אותה.
    await user.click(screen.getByRole('button', { name: he['list.delete'] }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: he['confirm.delete'] }),
    )

    await waitFor(() => expect(screen.queryByText('חניון')).not.toBeInTheDocument())
    expect(screen.getByText(he['toast.deleted'])).toBeInTheDocument()
  })

  it('מחפש לפי שם חנות ולפי פירוט', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())
    await addExpense(user, '10', 'ארומה', 'קפה')
    await addExpense(user, '200', 'רמי לוי', 'סופרמרקט')

    const searchField = screen.getByLabelText(he['filters.search'])

    await user.type(searchField, 'רמי')
    await waitFor(() => expect(screen.queryByText('ארומה')).not.toBeInTheDocument())
    expect(within(expenseList()).getByText('רמי לוי')).toBeInTheDocument()

    await user.clear(searchField)
    await user.type(searchField, 'קפה')
    await waitFor(() => expect(screen.queryByText('רמי לוי')).not.toBeInTheDocument())
    expect(within(expenseList()).getByText('ארומה')).toBeInTheDocument()
  })

  it('מציג סיכומים נפרדים לכל מטבע ואינו מחבר אותם', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())

    await addExpense(user, '100', 'בשקלים')
    await user.selectOptions(screen.getByLabelText(he['form.currency']), 'USD')
    await addExpense(user, '50', 'בדולרים')

    const summary = screen.getByLabelText(he['summary.title'])
    expect(within(summary).getByText(/ILS/)).toBeInTheDocument()
    expect(within(summary).getByText(/USD/)).toBeInTheDocument()
    expect(within(summary).getByText(he['summary.perCurrencyNote'])).toBeInTheDocument()
  })

  it('זוכר את המטבע האחרון שנבחר לאחר שמירה', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText(he['form.currency']), 'EUR')
    await addExpense(user, '30', 'חנות מתנות')

    expect(screen.getByLabelText(he['form.currency'])).toHaveValue('EUR')
    expect(localStorage.getItem(PREFERENCE_KEYS.lastCurrency)).toBe('EUR')
  })

  it('זוכר את הכרטיס שהוקלד ומציע אותו כברירת מחדל בפעם הבאה', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())

    // בפעם הראשונה השדה ריק לגמרי — אין כרטיסים מוגדרים מראש.
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('')

    await user.type(screen.getByLabelText(he['form.cardLast4']), '0921')
    await addExpense(user, '75', 'קסטרו')

    expect(JSON.parse(localStorage.getItem(PREFERENCE_KEYS.knownCards) ?? '[]')).toEqual(['0921'])

    // הפעלה מחדש: הכרטיס האחרון חוזר כברירת מחדל.
    unmount()
    render(<App />)
    await waitFor(() => expect(screen.getByLabelText(he['form.amount'])).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('0921')
  })

  it('מוסיף כרטיס חדש לראש רשימת ההצעות', async () => {
    const user = userEvent.setup()
    localStorage.setItem(PREFERENCE_KEYS.knownCards, JSON.stringify(['2213']))
    render(<App />)

    await waitFor(() => expect(screen.getByText(he['list.empty'])).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    // הכרטיס השמור מוצג ברשימה; מוסיפים חדש דרך האופציה האחרונה.
    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('2213')
    await user.selectOptions(screen.getByLabelText(he['form.cardLast4']), he['form.cardNew'])
    await user.type(screen.getByLabelText(he['form.cardLast4']), '0921')
    await addExpense(user, '40', 'ארומה')

    expect(JSON.parse(localStorage.getItem(PREFERENCE_KEYS.knownCards) ?? '[]')).toEqual([
      '0921',
      '2213',
    ])

    // הטופס חוזר למזומן אחרי שמירה; בבחירת אשראי שוב הכרטיס האחרון כבר שם.
    await user.click(screen.getByRole('button', { name: he['form.credit'] }))
    expect(screen.getByLabelText(he['form.cardLast4'])).toHaveValue('0921')
  })

  it('מחליף שפה וכיווניות', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(document.documentElement.dir).toBe('rtl')

    await user.click(screen.getByRole('button', { name: he['settings.title'] }))
    await user.click(screen.getByRole('button', { name: 'English' }))

    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'))
    expect(screen.getByLabelText(DICTIONARIES.en['form.merchant'])).toBeInTheDocument()
  })

  it('עולה באנגלית כברירת מחדל', async () => {
    localStorage.clear()
    render(<App />)

    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'))
    expect(screen.getByLabelText(DICTIONARIES.en['form.merchant'])).toBeInTheDocument()
  })
})
