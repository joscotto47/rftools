import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'pt' | 'en'

/** Text in both languages, for data files that live outside React components. */
export type Localized = { pt: string; en: string }

const STORAGE_KEY = 'rftools-lang'

let currentLang: Lang = 'pt'

/** Language used by formatters that run outside React (e.g. number formatting). */
export function getCurrentLang(): Lang {
  return currentLang
}

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'pt' || saved === 'en') return saved
  } catch {
    // Storage can be blocked (private mode); fall back to the browser language.
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language : 'pt-BR'
  return browser.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

type I18nValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Picks the text for the current language: t('Potência', 'Power'). */
  t: (pt: string, en: string) => string
  /** Same as t, for a { pt, en } object. */
  tl: (text: Localized) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    currentLang = initialLang()
    return currentLang
  })

  const setLang = useCallback((next: Lang) => {
    currentLang = next
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }, [lang])

  const value = useMemo<I18nValue>(() => ({
    lang,
    setLang,
    t: (pt, en) => (lang === 'pt' ? pt : en),
    tl: (text) => text[lang],
  }), [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}
