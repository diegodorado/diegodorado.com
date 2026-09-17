// Parity check (D10): diffs the Astro dist/ against the committed Gatsby
// oracle snapshot — route set, per-page visible text, image inventory.
// Byte identity is out of scope; semantic parity is the contract.
//
//   node scripts/parity-check.mjs [--slice 2]
//
// Slice 2 scope: skeleton pages + works listing/posts + cv + passthrough
// leaves. Per-route text modes:
//   alnum      full text, alphanumeric-normalized (punctuation/whitespace tolerant)
//   structure  es routes — D10 FOUC allowlist: Astro serves correct-locale
//              static HTML where Gatsby SSR emitted the English default.
//              Checks Spanish chrome tokens present, English chrome tokens
//              absent (per-route allowlist), plus a Spanish content spot token.
// Images are compared from slice 3 onward.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const SNAPSHOT = join(ROOT, 'scripts/oracle/snapshot.json')
const EN = join(ROOT, 'src/translations/en.json')
const ES = join(ROOT, 'src/translations/es.json')
const QUOTES = join(ROOT, 'src/data/quotes.json')
const WORKS = join(ROOT, 'content/works')

// Route -> comparison mode. es '/work' and the es works posts stay 'structure'
// because the oracle captured Gatsby's English-chrome SSR bug (D10); the en
// routes are full alnum. Content-pending routes get 'deferred'.
const TEXT_MODE = {
  '': 'alnum',
  '404': 'alnum',
  app: 'alnum',
  'en/le': 'alnum',
  'es/le': 'structure',
  'en/music': 'alnum',
  'es/music': 'structure',
  'en/bio': 'alnum',
  'es/bio': 'structure',
  'en/work': 'alnum',
  'es/work': 'structure',
  'en/bio/cv': 'alnum',
  'es/bio/cv': 'structure',
  'en/works/ada': 'alnum',
  'en/works/blue-mountain': 'alnum',
  'en/works/ceiborg': 'alnum',
  'en/works/cv2612': 'alnum',
  'en/works/human-aided-music': 'alnum',
  'en/works/i-o': 'alnum',
  'en/works/i-o/poem': 'alnum',
  'en/works/i-o/presentation': 'alnum',
  'en/works/lhcvmm': 'alnum',
  'en/works/live-coding': 'alnum',
  'en/works/live-emojing': 'alnum',
  'en/works/visuals': 'alnum',
  'es/works/ada': 'structure',
  'es/works/blue-mountain': 'structure',
  'es/works/ceiborg': 'structure',
  'es/works/cv2612': 'structure',
  'es/works/human-aided-music': 'structure',
  'es/works/i-o': 'structure',
  'es/works/i-o/poem': 'structure',
  'es/works/i-o/presentation': 'structure',
  'es/works/lhcvmm': 'structure',
  'es/works/live-coding': 'structure',
  'es/works/live-emojing': 'structure',
  'es/works/visuals': 'structure',
}
const SLICE_ROUTES = new Set(Object.keys(TEXT_MODE))
// English-token allowlist for structure mode: tokens that legitimately appear
// on the Spanish page without being Spanish chrome. D10 documented the pattern
// with lhcvmm's unlocalized description; the same applies to the other works
// whose es content keeps English passages (partially/unlocalized bodies and
// the CV's English work titles). Spanish-chrome presence/absence is still
// enforced — this only permits known English *content* on the page.
const ALLOWED_EN = {
  'es/work': ['music'],
  'es/bio/cv': ['music'],
  'es/works/i-o': ['music'],
  'es/works/i-o/presentation': ['work'],
  'es/works/lhcvmm': ['music', 'work'],
  'es/works/live-emojing': ['work', 'music'],
}
// Dist-only token allowlist for alnum mode. Gatsby's old remark render dropped
// the `tidal¬` / `js¬` prefixes of live-emojing's inline-code heading lines,
// so the oracle text has no `tidal` / `js` tokens while the current content
// (and the Astro output) does. Content wins over the stale render.
const DIST_EXTRA_ALLOW = {
  'en/works/live-emojing': ['tidal', 'js'],
}
// Static/ passthrough leaves compare verbatim-normalized (both frameworks
// copy them unchanged).
const PASSTHROUGH = [
  'algo-rimo',
  'blue-mountain',
  'fmtribe',
  'map-h',
  'en/live-emojing',
  'es/live-emojing',
  'live-emojing-presentation/en',
  'live-emojing-presentation/es',
]

function keyOf(path) {
  if (path === 'index.html') return ''
  if (path.endsWith('/index.html')) return path.slice(0, -'/index.html'.length)
  if (path.endsWith('.html')) return path.slice(0, -'.html'.length)
  return path
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '\u2013', mdash: '\u2014', hellip: '\u2026',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D',
  aacute: '\u00E1', eacute: '\u00E9', iacute: '\u00ED', oacute: '\u00F3',
  uacute: '\u00FA', ntilde: '\u00F1', agrave: '\u00E0', egrave: '\u00E8',
  igrave: '\u00EC', ograve: '\u00F2', ugrave: '\u00F9',
}

/** Mirror capture-oracle.mjs entity decoding (same map, same order). */
function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (match, entity) => {
    if (entity.startsWith('#')) {
      const code = entity[1] === 'x' || entity[1] === 'X'
        ? parseInt(entity.slice(2), 16)
        : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return ENTITIES[entity] ?? match
  })
}

/** Mirror capture-oracle.mjs visibleText EXACTLY: strip scripts/styles/
 *  noscript and tags FIRST, then decode entities, then collapse whitespace.
 *  The snapshot text was produced in this order; decoding entities first (as
 *  an earlier version of this script did) made escaped code like
 *  `&#x3C;swsn…&#x3E;` and entity-escaped pagination arrows normalize
 *  differently from the oracle text, producing phantom token deltas. */
function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, ''),
  )
    .trim()
    .replace(/\s+/g, ' ')
}

/** Word-token normalization: lowercase, split on non-alphanumeric runs. */
const words = (text) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9áéíóúüñç]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else if (p.endsWith('.html')) out.push(p)
  }
  return out
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

/** Translation chrome tokens keyed by word. */
async function chromeTokens(json) {
  const t = json.translation ?? json
  return ['Work', 'Music', 'Bio', 'Labs']
    .map((k) => t[k])
    .filter((value) => typeof value === 'string' && value.length > 0)
    .map((v) => words(v).join(' '))
}

/** Spanish content spot token per route (from the real data sources). */
async function spotTokens(key) {
  if (key === 'es/music') {
    const es = await readJson(ES)
    const intro = (es.translation ?? es).MusicIntro ?? ''
    return words(intro.replace(/<[^>]+>/g, ' ')).slice(0, 4)
  }
  if (key === 'es/work') {
    // Localized Spanish work titles — proof the listing renders the es
    // variants, not the English fallback.
    const titles = []
    for (const entry of await readdir(WORKS, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      try {
        const md = await readFile(join(WORKS, entry.name, 'index.es.md'), 'utf8')
        const m = md.match(/^title:\s*(.+)$/m)
        if (m) titles.push(m[1])
      } catch {
        /* unlocalized work (index.md) — no es variant */
      }
    }
    return words(titles.join(' ')).slice(0, 4)
  }
  const quotes = await readJson(QUOTES)
  const esQuote = quotes.es?.[0]?.[0] ?? ''
  return words(esQuote).slice(0, 3) // footer quote flows localized data
}

async function main() {
  const args = process.argv.slice(2)
  const sliceIdx = args.indexOf('--slice')
  const slice = sliceIdx >= 0 ? Number(args[sliceIdx + 1]) : 1

  const snapshot = await readJson(SNAPSHOT)
  const oracleByKey = new Map(
    snapshot.routes.map((r) => [keyOf(r.path), r]).filter(([k]) => !k.startsWith('_gatsby/')),
  )

  let distByKey = new Map()
  try {
    for (const file of await walk(DIST)) {
      distByKey.set(keyOf(file.slice(DIST.length + 1)), file)
    }
  } catch {
    /* no dist yet: RED by construction */
  }

  const enChrome = await chromeTokens(await readJson(EN))
  const esChrome = await chromeTokens(await readJson(ES))
  const routes = [...SLICE_ROUTES, ...PASSTHROUGH]

  let pass = 0
  let fail = 0
  let pending = 0

  for (const key of routes) {
    const oracle = oracleByKey.get(key)
    const distFile = distByKey.get(key)

    if (!oracle) {
      console.log(`FAIL ${key}  (missing from oracle snapshot)`)
      fail++
      continue
    }
    if (!distFile) {
      console.log(`FAIL ${key}  (missing from dist)`)
      fail++
      continue
    }

    const mode = TEXT_MODE[key] ?? 'alnum'
    const distText = words(visibleText(await readFile(distFile, 'utf8'))).join(' ')
    const oracleText = words(oracle.text).join(' ')

    if (mode === 'deferred') {
      console.log(`PENDING ${key}  (content in slice 2+)`)
      pending++
      continue
    }

    if (mode === 'alnum') {
      const extraAllow = DIST_EXTRA_ALLOW[key] ?? []
      const distNormalized = distText
        .split(' ')
        .filter((tok) => !extraAllow.includes(tok))
        .join(' ')
      const ok = oracleText === distNormalized
      console.log(`${ok ? 'PASS' : 'FAIL'} ${key}  (tokens ${distText.split(' ').length} vs ${oracleText.split(' ').length})`)
      ok ? pass++ : fail++
      continue
    }

    // structure mode: correct-locale static HTML (D10 FOUC allowlist).
    const distWordsSet = new Set(distText.split(' '))
    const missing = esChrome.filter((tok) => tok && !distWordsSet.has(tok))
    const forbidden = enChrome.filter(
      (tok) =>
        tok &&
        !esChrome.includes(tok) &&
        !ALLOWED_EN[key]?.includes(tok) &&
        distWordsSet.has(tok),
    )
    const spot = words((await spotTokens(key)).join(' '))
    const spotMissing = spot.filter((tok) => tok && !distWordsSet.has(tok))
    const ok = missing.length === 0 && forbidden.length === 0 && spotMissing.length === 0
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${key}  (es ${esChrome.length - missing.length}/${esChrome.length} · en-forbidden ${forbidden.length} · spot ${spot.length - spotMissing.length}/${spot.length})`
    )
    ok ? pass++ : fail++
  }

  console.log(`parity-check: slice ${slice} · ${pass} pass · ${fail} fail · ${pending} pending`)
  if (fail > 0) process.exit(1)
}

await main()