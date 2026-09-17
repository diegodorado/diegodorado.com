// i18n init for React islands (D3): i18next lives inside islands only; the
// language comes from the URL locale passed down by the Astro page. A missing
// URL locale falls back to 'en' — the Gatsby browser detector's default.
// Resources are the same en/es.json the static chrome reads at build time.
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../translations/en.json'
import es from '../translations/es.json'

export function initI18n(lng?: string): typeof i18n {
  if (i18n.isInitialized) return i18n
  i18n.use(initReactI18next).init({
    resources: { en, es },
    lng: lng === 'es' ? 'es' : 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    load: 'languageOnly',
    keySeparator: false,
    interpolation: { escapeValue: false },
  })
  return i18n
}