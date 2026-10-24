import { render, type RenderResult } from '@testing-library/react'
import { useState, type ReactElement } from 'react'
import { I18nProvider } from '../i18n/I18nProvider'
import type { Language } from '../i18n/strings'

function Wrapper({ initial, children }: { initial: Language; children: ReactElement }) {
  const [language, setLanguage] = useState<Language>(initial)
  return (
    <I18nProvider language={language} onLanguageChange={setLanguage}>
      {children}
    </I18nProvider>
  )
}

export function renderWithI18n(ui: ReactElement, language: Language = 'he'): RenderResult {
  return render(<Wrapper initial={language}>{ui}</Wrapper>)
}
