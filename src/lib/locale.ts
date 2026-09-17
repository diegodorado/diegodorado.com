import { site, type Locale } from '../data/site'
import en from '../translations/en.json'
import es from '../translations/es.json'

export type { Locale } from '../data/site'

export const DEFAULT_LOCALE: Locale = 'en'

export const translations: Record<Locale, Record<string, string>> = {
  en: (en as { translation: Record<string, string> }).translation ?? en,
  es: (es as { translation: Record<string, string> }).translation ?? es,
}

/** Keyed text at build (D6). Matches i18next semantics: a missing key falls
 *  back to the key string itself (en.json has no "Labs" / "Recent works"). */
export function t(locale: Locale, key: string): string {
  return translations[locale][key] ?? key
}

/** Gatsby link.js port: locale-prefix a root-relative path.
 *  Link to={`/work`} rendered — and SSR text extracted — as `/{lang}/work`. */
export function localizePath(path: string, locale: Locale): string {
  return `/${locale}${path}`
}

/** Swap the leading locale segment of a pathname (LanguagesLinks port). */
export function swapLocale(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`
  if (pathname.startsWith(`${prefix}/`)) return pathname.replace(prefix, `/${locale === 'en' ? 'es' : 'en'}`)
  return pathname
}

/** Language detected for the manual `/` redirect (index.tsx port): browser
 *  languages, first one starting with "es" wins, else en. */
export function detectLanguage(languages: readonly string[]): Locale {
  const found = languages.find((l) => l.toLowerCase().startsWith('es'))
  return found ? 'es' : DEFAULT_LOCALE
}

/** getStaticPaths helper for [lang] pages. Returns a fresh array on every
 *  call: Astro attaches a `.keyed` map to the returned array (see
 *  callGetStaticPaths in route-cache.js), so a shared module-level array
 *  would have its keys overwritten by the last route processed. */
export function localeParams(): { params: { lang: Locale } }[] {
  return site.langs.map((lang) => ({ params: { lang } }))
}