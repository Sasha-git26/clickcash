import { useState, type FocusEvent } from 'react'
import { CARD_LAST4_LENGTH } from '../types/expense'
import { useI18n } from '../i18n/I18nProvider'

/**
 * ערך סנטינל לאופציה "כרטיס חדש". ארבע ספרות לעולם לא יתנגשו בו.
 */
const NEW_CARD = '__new__'

interface CardFieldProps {
  id: string
  value: string
  /** הכרטיסים שהוקלדו בעבר, מהאחרון בשימוש ואחורה. */
  knownCards: string[]
  disabled: boolean
  invalid: boolean
  errorId?: string
  onChange: (cardLast4: string) => void
  onFocus?: (event: FocusEvent<HTMLElement>) => void
}

/**
 * בחירת כרטיס מתוך כל הכרטיסים שהוקלדו בעבר, עם אופציה להוסיף חדש.
 *
 * הרכיב מוצג רק בתוך בלוק האשראי, שמתפרק בכל מעבר ל"מזומן" — ולכן מצב
 * "מוסיף כרטיס חדש" מתאפס מעצמו אחרי שמירה בלי צורך ב-useEffect.
 */
export function CardField({
  id,
  value,
  knownCards,
  disabled,
  invalid,
  errorId,
  onChange,
  onFocus,
}: CardFieldProps) {
  const { t } = useI18n()
  // ללא כרטיסים שמורים אין מה לפתוח; כרטיס של רשומה ישנה שאינו ברשימה
  // נשאר ניתן לעריכה במקום להיעלם. גם ערך ריק נכנס להקלדה: select עם
  // value שאינו קיים באופציות מציג את הראשונה ומסתיר ערך ריק שנדחה בוולידציה.
  const [addingCard, setAddingCard] = useState(
    () => knownCards.length === 0 || !knownCards.includes(value),
  )
  // המיקוד נכנס רק כשהמשתמש בחר "כרטיס חדש"; בטעינה רגילה הוא היה חוטף
  // את המיקוד ופותח את המקלדת על שדה הכרטיס בלי שביקשו.
  const [focusNewCard, setFocusNewCard] = useState(false)

  const invalidClass = invalid ? 'field-input-invalid' : ''
  const ariaProps = {
    'aria-invalid': invalid ? true : undefined,
    'aria-errormessage': invalid ? errorId : undefined,
  }

  if (addingCard) {
    return (
      <>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          dir="ltr"
          maxLength={CARD_LAST4_LENGTH}
          className={`field-input tracking-widest ${invalidClass}`}
          placeholder={t('form.cardLast4Placeholder')}
          value={value}
          disabled={disabled}
          // אחרי בחירת "כרטיס חדש" המיקוד נכנס לשדה מיד, כדי שהמקלדת
          // תיפתח בלי לחיצה נוספת.
          autoFocus={focusNewCard}
          {...ariaProps}
          onFocus={onFocus}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, '').slice(0, CARD_LAST4_LENGTH))
          }
        />
        {knownCards.length > 0 && (
          <button
            type="button"
            className="btn-ghost mt-1 min-h-10 w-full px-2 text-sm"
            disabled={disabled}
            onClick={() => {
              setAddingCard(false)
              setFocusNewCard(false)
              onChange(knownCards[0])
            }}
          >
            {t('form.cancel')}
          </button>
        )}
      </>
    )
  }

  return (
    <select
      id={id}
      dir="ltr"
      className={`field-input py-3 tracking-widest ${invalidClass}`}
      value={value}
      disabled={disabled}
      {...ariaProps}
      onChange={(event) => {
        if (event.target.value === NEW_CARD) {
          // מרוקנים את הערך כדי שהוולידציה תדרוש ארבע ספרות חדשות.
          setAddingCard(true)
          setFocusNewCard(true)
          onChange('')
          return
        }
        onChange(event.target.value)
      }}
    >
      {knownCards.map((card) => (
        <option key={card} value={card}>
          {card}
        </option>
      ))}
      <option value={NEW_CARD}>{t('form.cardNew')}</option>
    </select>
  )
}
