#!/usr/bin/env node
/**
 * capture-oracle.mjs — SDD framework-migration oracle capture (D10).
 *
 * Builds the last-green Gatsby `main` and emits a semantic snapshot of its
 * output into `scripts/oracle/snapshot.json`. The snapshot is the parity
 * baseline the Astro migration diffs against via `scripts/parity-check.mjs`.
 *
 * Snapshot semantics (never bytes): per emitted HTML file, the whitespace-
 * collapsed visible text plus the image inventory (resolved src, whether a
 * responsive srcset is present, whether a blurred placeholder is present).
 * Hash-named asset filenames are expected to differ between frameworks, so
 * paths are recorded and compared, not asset bytes.
 *
 * Usage: node scripts/capture-oracle.mjs
 * Exits non-zero when the Gatsby build fails or no HTML files are emitted.
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(repoRoot, 'public')
const snapshotDir = join(repoRoot, 'scripts', 'oracle')
const snapshotPath = join(snapshotDir, 'snapshot.json')

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  aacute: '\u00E1',
  eacute: '\u00E9',
  iacute: '\u00ED',
  oacute: '\u00F3',
  uacute: '\u00FA',
  ntilde: '\u00F1',
  agrave: '\u00E0',
  egrave: '\u00E8',
  igrave: '\u00EC',
  ograve: '\u00F2',
  ugrave: '\u00F9',
}

const decodeEntities = (text) =>
  text.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (match, entity) => {
    if (entity.startsWith('#')) {
      const code = entity[1] === 'x' || entity[1] === 'X'
        ? parseInt(entity.slice(2), 16)
        : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return ENTITIES[entity] ?? match
  })

/** Visible text: strip scripts/styles, decode entities, drop tags, collapse whitespace. */
const visibleText = (html) =>
  decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
  )
    .trim()
    .replace(/\s+/g, ' ')

/** Blurred placeholder evidence around an <img>: gatsby-plugin-image renders a
 *  `data-placeholder-image` dominant-color div; gatsby-remark-images renders a
 *  `gatsby-resp-image-background-image` span with a data: LQIP — both sit
 *  immediately before the <img>. */
const hasPlaceholderNear = (html, index) => {
  const window = html.slice(Math.max(0, index - 1200), index + 400)
  return (
    /data-placeholder-image=/.test(window) ||
    /background-image:\s*(?:url\()?['"]?data:image\//i.test(window)
  )
}

const resolveRef = (raw, baseDir) => {
  if (!raw || raw.startsWith('data:') || raw.startsWith('/') || raw.startsWith('http')) return raw
  if (!raw.startsWith('./') && !raw.startsWith('../')) return raw
  const path = raw.split(/[?#]/)[0]
  return join('/', baseDir, path).split(sep).join('/')
}

const walkHtml = (dir) => {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) files.push(...walkHtml(full))
    else if (entry.endsWith('.html')) files.push(full)
  }
  return files
}

const build = () => {
  console.log('[oracle] running `yarn build` (Gatsby)…')
  const result = spawnSync('yarn', ['build'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  })
  return result.status
}

const gatsbyVersion = () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
  return pkg.dependencies?.gatsby ?? 'unknown'
}

const headCommit = () => {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : 'unknown'
}

const main = () => {
  const buildStatus = build()
  if (buildStatus !== 0) {
    console.error(`[oracle] Gatsby build failed with exit code ${buildStatus}; not writing a snapshot.`)
    process.exit(buildStatus || 1)
  }

  const htmlFiles = walkHtml(publicDir)
  if (htmlFiles.length === 0) {
    console.error('[oracle] no HTML files under public/; refusing to write an empty snapshot.')
    process.exit(1)
  }

  const routes = htmlFiles
    .map((file) => {
      const html = readFileSync(file, 'utf8')
      const baseDir = dirname(relative(publicDir, file)).split(sep).join('/')
      const images = []
      // <noscript> blocks repeat each GatsbyImage (SSR + noscript fallback); they
      // duplicate the same slot, so skip img tags inside them.
      const noscriptRanges = [...html.matchAll(/<noscript\b[\s\S]*?<\/noscript>/gi)].map(
        (m) => [m.index, m.index + m[0].length]
      )
      const insideNoscript = (index) =>
        noscriptRanges.some(([start, end]) => index >= start && index < end)
      const imgRe = /<img\b[^>]*>/gi
      for (const match of html.matchAll(imgRe)) {
        if (insideNoscript(match.index)) continue
        const tag = match[0]
        const src = /data-src="([^"]*)"/i.exec(tag)?.[1] ?? /src="([^"]*)"/i.exec(tag)?.[1] ?? ''
        // Lazy SSR stubs carry no src until hydration; they are not a distinct image.
        if (!src) continue
        images.push({
          src: resolveRef(src, baseDir),
          srcset: /(?:srcset|data-srcset)="[^"]+"/i.test(tag),
          placeholder: hasPlaceholderNear(html, match.index),
        })
      }
      return {
        path: relative(publicDir, file).split(sep).join('/'),
        text: visibleText(html),
        images,
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))

  const snapshot = {
    meta: {
      capturedAt: new Date().toISOString(),
      commit: headCommit(),
      gatsbyVersion: gatsbyVersion(),
    },
    routes,
  }

  mkdirSync(snapshotDir, { recursive: true })
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')

  const imageCount = routes.reduce((acc, route) => acc + route.images.length, 0)
  console.log(`[oracle] captured ${routes.length} routes, ${imageCount} images -> ${snapshotPath}`)
}

main()