import { describe, expect, it } from 'vitest'
import {
  installmentAmountMinor,
  minorToAmountInput,
  parseAmountToMinor,
} from './money'

describe('parseAmountToMinor', () => {
  it('ממיר שלמים ועשרוניים ליחידות משנה', () => {
    expect(parseAmountToMinor('10')).toBe(1000)
    expect(parseAmountToMinor('25.5')).toBe(2550)
    expect(parseAmountToMinor('25.50')).toBe(2550)
    expect(parseAmountToMinor('0.05')).toBe(5)
    expect(parseAmountToMinor('.5')).toBe(50)
  })

  it('מקבל פסיק כמפריד עשרוני ומתעלם ברווחים', () => {
    expect(parseAmountToMinor('25,50')).toBe(2550)
    expect(parseAmountToMinor(' 12.30 ')).toBe(1230)
  })

  it('פוסל קלט לא חוקי', () => {
    expect(parseAmountToMinor('')).toBeNull()
    expect(parseAmountToMinor('abc')).toBeNull()
    expect(parseAmountToMinor('-5')).toBeNull()
    expect(parseAmountToMinor('0')).toBeNull()
    expect(parseAmountToMinor('1.234')).toBeNull()
    expect(parseAmountToMinor('1.2.3')).toBeNull()
  })

  it('לא מצטברות שגיאות עשרוניות בסכומים בעייתיים', () => {
    // 0.1 + 0.2 ביחידות משנה הוא 30 בדיוק, לא 0.30000000000000004.
    expect(parseAmountToMinor('0.1')! + parseAmountToMinor('0.2')!).toBe(30)
    expect(parseAmountToMinor('19.99')).toBe(1999)
  })
})

describe('minorToAmountInput', () => {
  it('מחזיר מחרוזת עשרונית לעריכה בטופס', () => {
    expect(minorToAmountInput(2550)).toBe('25.50')
    expect(minorToAmountInput(5)).toBe('0.05')
    expect(minorToAmountInput(100000)).toBe('1000.00')
  })
})

describe('installmentAmountMinor', () => {
  it('מחזיר את הסכום המלא בתשלום אחד', () => {
    expect(installmentAmountMinor(1000, 1)).toBe(1000)
  })

  it('מעגל כלפי מעלה כדי שסכום התשלומים לא ייפול מהסכום המקורי', () => {
    expect(installmentAmountMinor(1000, 3)).toBe(334)
    expect(installmentAmountMinor(1000, 3) * 3).toBeGreaterThanOrEqual(1000)
    expect(installmentAmountMinor(12000, 12)).toBe(1000)
  })
})
