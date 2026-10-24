import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import {
  DICTIONARIES,
  LANGUAGE_META,
  interpolate,
  type Language,
  type StringKey,
} from './strings'

export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  dir: 'rtl' | 'ltr'
  locale: string
  t: Translate
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
  language: Language
  onLanguageChange: (language: Language) => void
  children: ReactNode
}

export function I18nProvider({ language, onLanguageChange, children }: I18nProviderProps) {
  const meta = LANGUAGE_META[language]

  // <html lang/dir> נקבע כאן ולא ב-index.html, כדי שהחלפת שפה תהפוך גם את הכיווניות.
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = meta.dir
  }, [language, meta.dir])

  const t = useCallback<Translate>(
    (key, vars) => interpolate(DICTIONARIES[language][key], vars),
    [language],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage: onLanguageChange, dir: meta.dir, locale: meta.locale, t }),
    [language, onLanguageChange, meta.dir, meta.locale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
