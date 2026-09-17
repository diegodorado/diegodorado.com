// Parity check (D10): diffs the Astro dist/ against the committed Gatsby
// oracle snapshot — route set, per-page visible text, image inventory.
// Byte identity is out of scope; semantic parity is the contract.
//
//   node scripts/parity-check.mjs [--slice 1]
//
// Slice 1 scope: skeleton pages + static/ passthrough leaves. Per-route text
// modes:
//   alnum      full text, alphanumeric-normalized (punctuation/whitespace tolerant)
//   structure  es skeleton routes — D10 FOUC allowlist: Astro serves
//              correct-locale static HTML where Gatsby SSR emitted the English
//              default. Checks Spanish chrome tokens present, English chrome
//              tokens absent, plus a Spanish content spot token.
//   deferred   content lands in a later slice (works list, cv body).
// Images are compared from slice 3 onward.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const SNAPSHOT = join(ROOT, 'scripts/oracle/snapshot.json')
const EN = join(ROOT, 'src/translations/en.json')
const ES = join(ROOT, 'src/translations/es.json')
const QUOTES = join(ROOT, 'src/data/quotes.json')

// Route -> comparison mode for slice 1. Content-pending routes get 'deferred'.
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
  'en/work': 'deferred',
  'es/work': 'deferred',
  'en/bio/cv': 'deferred',
  'es/bio/cv': 'deferred',
}
const SLICE_ROUTES = new Set(Object.keys(TEXT_MODE))
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

/** Mirror capture-oracle.mjs visibleText: decode entities, drop scripts/
 *  styles/noscript/tags, collapse whitespace — same normalization the oracle
 *  snapshot text was produced with. */
function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (match, entity) => {
      if (entity.startsWith('#')) {
        const code = entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10)
        return Number.isFinite(code) ? String.fromCodePoint(code) : match
      }
      return ENTITIES[entity] ?? match
    })
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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
      const ok = oracleText === distText
      console.log(`${ok ? 'PASS' : 'FAIL'} ${key}  (tokens ${distText.split(' ').length} vs ${oracleText.split(' ').length})`)
      ok ? pass++ : fail++
      continue
    }

    // structure mode: correct-locale static HTML (D10 FOUC allowlist).
    const distWordsSet = new Set(distText.split(' '))
    const missing = esChrome.filter((tok) => tok && !distWordsSet.has(tok))
    const forbidden = enChrome.filter((tok) => tok && !esChrome.includes(tok) && distWordsSet.has(tok))
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