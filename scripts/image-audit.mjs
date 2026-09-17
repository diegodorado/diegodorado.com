// Image audit (D10/testing strategy, task 3.5): the slice-3 image gate.
//
//   node scripts/image-audit.mjs
//
// For every oracle route in this slice (TEXT_MODE set — labs routes land in
// Phase 5, passthrough leaves are verbatim static files):
//   1. COUNT — `dist/<route>.html` <picture> count must equal the frozen
//      oracle `images[]` length for the route (the oracle inventory counts
//      <img>s; every pipeline image is one <picture> with one <img> fallback).
//      No stray bare <img> outside <picture> is allowed on those routes.
//   2. FORMATS — every <picture> must carry an image/avif source and an
//      image/webp source (spec: Formats and Placeholders Default).
//   3. BLUR — every <picture> must be preceded by the blurred placeholder
//      layer: a `background-image:url(...webp)` span with a blur filter
//      (ensemble = the Astro 6.4.8 equivalent of `placeholder="blurred"`,
//      which the pinned astro:assets does not expose — research gate 5.1).
//   4. NO ANCHOR — on work-post routes, no <a href="...image-ext..."> may
//      contain a <picture> (spec: in-markdown images MUST NOT link to the
//      original file; covers live only in the work listing, where the anchor
//      points to the post, never to the image file itself).
//
// Snapshot integrity: reads scripts/oracle/snapshot.json (frozen) — never
// writes it.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const SNAPSHOT = join(ROOT, 'scripts/oracle/snapshot.json')

// Same route scope as parity-check.mjs TEXT_MODE (slice 3: everything but
// labs). Labs routes are absent from dist until Phase 5.
const SLICE_ROUTES = Object.keys({
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
})

function keyOf(path) {
  if (path === 'index.html') return ''
  if (path.endsWith('/index.html')) return path.slice(0, -'/index.html'.length)
  if (path.endsWith('.html')) return path.slice(0, -'.html'.length)
  return path
}

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else if (p.endsWith('.html')) out.push(p)
  }
  return out
}

const main = async () => {
  const snapshot = JSON.parse(await readFile(SNAPSHOT, 'utf8'))
  const oracleByKey = new Map(
    snapshot.routes.map((r) => [keyOf(r.path), r]).filter(([k]) => !k.startsWith('_gatsby/')),
  )

  let distByKey = new Map()
  try {
    for (const file of await walk(DIST)) {
      distByKey.set(keyOf(file.slice(DIST.length + 1)), file)
    }
  } catch {
    process.exit(1) // no dist: RED by construction
  }

  const pictureRe = /<picture\b[\s\S]*?<\/picture>/gi
  const bareImgRe = /<img\b[^>]*>/gi
  const sourceTypeRe = /<source\b[^>]*type="image\/(avif|webp)"[^>]*>/gi

  let pass = 0
  let fail = 0
  const failures = []

  const audit = (key, ok, detail) => {
    if (ok) {
      pass++
    } else {
      fail++
      failures.push(`  FAIL ${key}: ${detail}`)
    }
  }

  for (const key of SLICE_ROUTES) {
    const oracle = oracleByKey.get(key)
    const distFile = distByKey.get(key)
    if (!oracle) {
      audit(key, false, 'missing from oracle snapshot')
      continue
    }
    if (!distFile) {
      audit(key, false, 'missing from dist')
      continue
    }

    const html = await readFile(distFile, 'utf8')
    const pictures = [...html.matchAll(pictureRe)].map((m) => m[0])
    const expected = oracle.images.length

    // COUNT: one <picture> per oracle image; zero bare imgs on slice routes
    // (every pipeline image is a picture; static passthrough is out of scope).
    if (pictures.length !== expected) {
      audit(key, false, `pictures ${pictures.length} != oracle images ${expected}`)
      continue // no point checking formats on a count mismatch
    }
    const bareImg = [...html.matchAll(bareImgRe)]
    const stray = bareImg.filter((m) => !isInsidePicture(html, m.index, pictures))
    if (stray.length > 0) {
      audit(key, false, `${stray.length} bare <img> outside <picture>`)
      continue
    }

    // FORMATS + BLUR per picture.
    let formatsOk = true
    let blurOk = true
    for (const m of html.matchAll(pictureRe)) {
      const pic = m[0]
      const types = [...pic.matchAll(sourceTypeRe)].map((s) => s[1])
      if (!types.includes('avif') || !types.includes('webp')) {
        formatsOk = false
        continue
      }
      // blur layer: background-image:url('…webp') + filter:blur within the
      // wrapper that precedes this <picture> (same window the oracle greps).
      const window = html.slice(Math.max(0, m.index - 600), m.index + 50)
      if (
        !/background-image\s*:\s*url\([^)]*\.webp/i.test(window) ||
        !/filter\s*:\s*blur/i.test(window)
      ) {
        blurOk = false
      }
    }
    audit(key, formatsOk, formatsOk ? '' : 'missing avif and/or webp source in a <picture>')
    audit(key, blurOk, blurOk ? '' : 'missing blurred placeholder layer before a <picture>')

    // NO ANCHOR (in-post md images): no <a href="...image"> wrapping a
    // <picture>. Covers in /work link to the post (no image extension).
    if (/^en\/works\//.test(key) || /^es\/works\//.test(key)) {
      const anchored = /<a\b[^>]*href="[^"]+\.(?:png|jpe?g|webp|gif|avif)"[^>]*>[\s\S]{0,600}?<picture/i.test(html)
      audit(key, !anchored, anchored ? 'an anchor links a markdown image to the original file' : '')
    }
  }

  console.log(`image-audit: ${pass} pass · ${fail} fail`)
  if (failures.length) {
    for (const f of failures) console.log(f)
    process.exit(1)
  }
  console.log('image-audit: slice 3 GREEN')
}

/** true when the bare <img> at index sits inside one of the matched <picture>s */
function isInsidePicture(html, index, pictures) {
  // find the picture whose start < index < end
  const before = html.slice(0, index)
  const starts = [...before.matchAll(/<picture\b/gi)]
  if (!starts.length) return false
  const lastStart = starts.at(-1).index
  const close = html.indexOf('</picture>', index)
  return close !== -1 && lastStart !== undefined && lastStart < index
}

await main()