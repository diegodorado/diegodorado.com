import type { CollectionEntry } from 'astro:content'
import type { Locale } from '../data/site'

export interface DerivedWork {
  entry: CollectionEntry<'works'>
  slug: string
  locale: string
  index: boolean
}

export interface WorkRoute {
  lang: Locale
  segments: string[]
  prev: string | null
  next: string | null
  pathname: string
  entry: CollectionEntry<'works'>
}

const dateMs = (w: CollectionEntry<'works'>): number => w.data.date?.getTime() ?? 0

export function deriveWorks(works: CollectionEntry<'works'>[]): DerivedWork[] {
  return works.map((entry) => {
    const id = entry.id.replace(/\.md$/, '')
    const parts = id.split('/')
    const name = parts[parts.length - 1]!
    const dirs = parts.slice(0, -1).join('/')
    const localized = name.includes('.')
    const locale = localized ? name.split('.')[1]! : ''
    const index = name.startsWith('index')
    let slug = `/works${dirs ? `/${dirs}` : ''}/${name === 'index' ? '' : name}`
    if (localized || name === 'index') {
      slug = slug.replace(`.${locale}`, '').replace('/index', '')
    }
    return { entry, slug: slug.replace(/\/+$/, ''), locale, index }
  })
}

export function resolveRoutes(works: CollectionEntry<'works'>[]): WorkRoute[] {
  const derived = deriveWorks(works)
  const main = derived
    .filter((w) => w.index && w.locale !== 'en')
    .sort((a, b) => dateMs(b.entry) - dateMs(a.entry))
  const mainSlugs = main.map((w) => w.slug)
  const routes: WorkRoute[] = []
  for (const w of derived) {
    const i = mainSlugs.reduce(
      (acc, cur, idx) => (w.slug.startsWith(cur) ? idx : acc),
      0,
    )
    const prev = i === mainSlugs.length - 1 ? null : mainSlugs[i + 1]
    const next = i === 0 ? null : mainSlugs[i - 1]
    const segments = w.slug.replace(/^\/works\/?/, '').split('/').filter(Boolean)
    const push = (lang: Locale) =>
      routes.push({
        lang,
        segments,
        prev,
        next,
        pathname: `/${lang}/works/${segments.join('/')}`,
        entry: w.entry,
      })
    if (w.locale === '') {
      push('en')
      push('es')
    } else {
      push(w.locale as Locale)
    }
  }
  return routes
}