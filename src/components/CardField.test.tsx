import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardField } from './CardField'
import { renderWithI18n } from '../test/renderWithI18n'
import { DICTIONARIES } from '../i18n/strings'

const he = DICTIONARIES.he

/** הרכיב נטען בלי טופס עוטף, ולכן התווית מסופקת כאן. */
function setup(value: string, knownCards: string[]) {
  const onChange = vi.fn()
  renderWithI18n(
    <>
      <label htmlFor="card">{he['form.cardLast4']}</label>
      <CardField
        id="card"
        value={value}
        knownCards={knownCards}
        disabled={false}
        invalid={false}
        onChange={onChange}
      />
    </>,
  )
  return {
    onChange,
    user: userEvent.setup(),
    field: () => screen.getByLabelText(he['form.cardLast4']),
  }
}

describe('CardField', () => {
  it('מציג רשימה כשהערך הוא אחד הכרטיסים השמורים', () => {
    const { field } = setup('0921', ['0921', '2213'])

    expect(field().tagName).toBe('SELECT')
    expect(field()).toHaveValue('0921')
  })

  it('מציג שדה הקלדה כשהערך ריק, גם כשיש כרטיסים שמורים', () => {
    // select שערכו ריק מציג את הכרטיס הראשון בעוד הטופס מחזיק '' —
    // המשתמש רואה כרטיס, ההוספה נדחית, ובחירה חוזרת באותה אופציה
    // אינה מפעילה onChange. לכן ערך ריק נכנס להקלדה.
    const { field } = setup('', ['0921', '2213'])

    expect(field().tagName).toBe('INPUT')
    expect(field()).toHaveValue('')
  })

  it('משאיר כרטיס של רשומה ישנה ניתן לעריכה, בלי לחטוף את המיקוד', () => {
    const { field } = setup('7777', ['0921'])

    expect(field().tagName).toBe('INPUT')
    expect(field()).toHaveValue('7777')
    expect(field()).not.toHaveFocus()
  })

  it('ממקד את שדה ההקלדה רק אחרי בחירת "כרטיס חדש"', async () => {
    const { user, field, onChange } = setup('0921', ['0921', '2213'])

    await user.selectOptions(field(), he['form.cardNew'])

    expect(onChange).toHaveBeenCalledWith('')
    expect(field().tagName).toBe('INPUT')
    expect(field()).toHaveFocus()
  })
})
