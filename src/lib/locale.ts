import { site, type Locale } from '../data/site'
import en from '../translations/en.json'
import es from '../translations/es.json'

export type { Locale } from '../data/site'

export const DEFAULT_LOCALE: Locale = 'en'

export const translations: Record<Locale, Record<string, string>> = {
  en: (en as { translation: Record<string, string> }).translation ?? en,
  es: (es as { translation: Record<string, string> }).translation ?? es,
}

export function t(locale: Locale, key: string): string {
  return translations[locale][key] ?? key
}

export function localizePath(path: string, locale: Locale): string {
  return `/${locale}${path}`
}

export function swapLocale(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`
  if (pathname.startsWith(`${prefix}/`)) return pathname.replace(prefix, `/${locale === 'en' ? 'es' : 'en'}`)
  return pathname
}

export function detectLanguage(languages: readonly string[]): Locale {
  const found = languages.find((l) => l.toLowerCase().startsWith('es'))
  return found ? 'es' : DEFAULT_LOCALE
}

export function localeParams(): { params: { lang: Locale } }[] {
  return site.langs.map((lang) => ({ params: { lang } }))
}