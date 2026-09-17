// Route-map RED test (D2, D9): diffs the oracle golden route set against the
// emitted Astro dist/, slice-local for fast feedback.
//
//   node scripts/route-map.mjs [--slice 1]
//
// The oracle path-set (scripts/oracle/snapshot.json) is the pre-merge
// authority; this script is the slice-local fast check. Slice scope is
// derived from the snapshot minus later-phase route patterns
// (works posts + labs land in slices 2..5).
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const SNAPSHOT = join(ROOT, 'scripts/oracle/snapshot.json')

// Later-phase route patterns, absent until their slice lands.
// All slices complete — no pending later-phase routes.
const LATER_PHASE = []

// Normalize an emitted HTML path to a route key shared with the oracle.
//   "index.html"            -> ""
//   "en/work/index.html"    -> "en/work"
//   "404.html" / "404/index.html" -> "404"
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

const args = process.argv.slice(2)
const sliceIdx = args.indexOf('--slice')
const slice = sliceIdx >= 0 ? Number(args[sliceIdx + 1]) : 1

const snapshot = JSON.parse(await readFile(SNAPSHOT, 'utf8'))

const expectedKeys = new Set(
  snapshot.routes
    .map((r) => keyOf(r.path))
    .filter((k) => !k.startsWith('_gatsby/')),
)
const expectedSlice = new Set(
  [...expectedKeys].filter((k) => !LATER_PHASE.some((re) => re.test(k))),
)
const expectedLater = new Set([...expectedKeys].filter((k) => !expectedSlice.has(k)))

let actualKeys
try {
  const files = await walk(DIST)
  actualKeys = new Set(files.map((f) => keyOf(f.slice(DIST.length + 1))))
} catch {
  actualKeys = new Set() // no dist yet: RED by construction
}

const missing = [...expectedSlice].filter((k) => !actualKeys.has(k)).sort()
const extra = [...actualKeys].filter((k) => !expectedKeys.has(k)).sort()

console.log(`slice ${slice} · expected ${expectedSlice.size} · later ${expectedLater.size} · emitted ${actualKeys.size}`)
if (missing.length) {
  console.log(`MISSING (${missing.length}):`)
  for (const k of missing) console.log(`  - ${k}`)
} else {
  console.log('MISSING: none')
}
if (extra.length) {
  console.log(`EXTRA (${extra.length}):`)
  for (const k of extra) console.log(`  + ${k}`)
} else {
  console.log('EXTRA: none')
}
console.log(`later-phase pending (informational): ${[...expectedLater].length} routes`)

if (missing.length || extra.length) process.exit(1)
console.log(`route-map: slice ${slice} GREEN`)