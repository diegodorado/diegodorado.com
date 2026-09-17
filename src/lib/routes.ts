// D2 route derivation — port of gatsby-node.js onCreateNode + createPages.
// Oracle-verified: every index file resolves WITHOUT the '/index' segment
// (e.g. i-o's main slug is '/works/i-o', not '/works/i-o/index'), which is
// what makes i-o/poem and i-o/presentation pin their pagination neighbors to
// i-o instead of falling back to the default prev/next on the main index.
import type { CollectionEntry } from 'astro:content'
import type { Locale } from '../data/site'

export interface DerivedWork {
  entry: CollectionEntry<'works'>
  /** Canonical slug, e.g. '/works/i-o/poem' (no locale prefix). */
  slug: string
  /** '' for locale-agnostic files (index.md, presentation.md), else 'en'|'es'. */
  locale: string
  /** name.startsWith('index') — poem/presentation are not index works. */
  index: boolean
}

export interface WorkRoute {
  lang: Locale
  /** Slug segments for [lang]/works/[...slug], e.g. ['i-o', 'poem']. */
  segments: string[]
  /** Canonical slug of the older neighbor (renders `=>`), localized at render. */
  prev: string | null
  /** Canonical slug of the newer neighbor (renders `<=`), localized at render. */
  next: string | null
  /** pathname for the header active state, e.g. '/en/works/i-o/poem'. */
  pathname: string
  entry: CollectionEntry<'works'>
}

const dateMs = (w: CollectionEntry<'works'>): number => w.data.date?.getTime() ?? 0

/** onCreateNode port: derive locale / slug / index flag from id and path. */
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

/** createPages port: main-works index (index works, locale es|'', date DESC) and
 *  per-work prev/next from the last prefix match — gatsby reduce verbatim. */
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