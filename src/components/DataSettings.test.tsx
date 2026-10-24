import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataSettings } from './DataSettings'
import { buildBackup } from '../domain/backup'
import { makeExpense } from '../test/factories'
import { renderWithI18n } from '../test/renderWithI18n'
import { DICTIONARIES, interpolate } from '../i18n/strings'

const he = DICTIONARIES.he

function setup() {
  const onRestore = vi.fn().mockResolvedValue(undefined)
  const onNotify = vi.fn()
  const { container } = renderWithI18n(
    <DataSettings expenses={[makeExpense()]} onRestore={onRestore} onNotify={onNotify} />,
  )
  return { onRestore, onNotify, container, user: userEvent.setup() }
}

/** בוחר קובץ גיבוי ומאשר את השחזור. */
async function restore(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  contents: unknown,
) {
  await user.click(screen.getByRole('button', { name: he['settings.title'] }))
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
  await user.upload(
    fileInput,
    new File([JSON.stringify(contents)], 'hotzaot.json', { type: 'application/json' }),
  )

  const dialog = await screen.findByRole('alertdialog')
  await user.click(
    within(dialog).getByRole('button', { name: he['settings.restoreConfirmAction'] }),
  )
}

describe('DataSettings', () => {
  it('מדווח כמה הוצאות שוחזרו', async () => {
    const { user, container, onRestore, onNotify } = setup()
    const backup = buildBackup([makeExpense({ merchant: 'פז' }), makeExpense({ merchant: 'ארומה' })])

    await restore(user, container, backup)

    await waitFor(() => expect(onRestore).toHaveBeenCalled())
    expect(onRestore.mock.calls[0][0]).toHaveLength(2)
    expect(onNotify).toHaveBeenCalledWith(interpolate(he['toast.restored'], { count: 2 }))
  })

  it('מדווח גם על רשומות שנפסלו, כי השחזור כבר מחק את הקודמות', async () => {
    const { user, container, onRestore, onNotify } = setup()
    const backup = buildBackup([makeExpense({ merchant: 'פז' })])
    // רשומה ללא מזהה וללא סכום תקין נפסלת בוולידציה ואינה מיובאת.
    const withInvalid = { ...backup, expenses: [...backup.expenses, { merchant: 'שבור' }] }

    await restore(user, container, withInvalid)

    await waitFor(() => expect(onRestore).toHaveBeenCalled())
    expect(onRestore.mock.calls[0][0]).toHaveLength(1)
    expect(onNotify).toHaveBeenCalledWith(
      interpolate(he['toast.restoredPartial'], { count: 1, skipped: 1 }),
    )
  })
})
