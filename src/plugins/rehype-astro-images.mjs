/**
 * rehype-astro-images (D4/D5, task 3.4): gatsby-remark-images port for
 * in-post markdown images — sharp-native variant generation.
 *
 * Intentional deviation from design D4 ("getImage() per relative src"): this
 * plugin is imported by astro.config.mjs and therefore runs in the CONFIG Vite
 * graph, whose module runner is CLOSED by the time markdown renders — so
 * `astro:assets` / getImage is unreachable there (verified at apply: lazy
 * `import('astro:assets')` throws "Vite module runner has been closed", the
 * static form "Cannot find module 'astro:assets'", and D4's getImage() call
 * cannot resolve). Instead, this plugin generates the responsive variants
 * ITSELF with the already-installed `sharp` and stages them under
 * `.astro/md-assets/` — Astro's `emptyDir(outDir)` (static-build.js) WIPES
 * `<outDir>` after content sync and before the vite build, so writing into
 * `dist/_astro` during markdown render is wiped within the same build. A tiny
 * vite-plugin in astro.config.mjs copies the staged files into
 * `<outDir>/<assetsDir>` (default `dist/_astro` — the same location Astro's
 * own image service uses) at bundle-emit time; in-markdown references use
 * public URLs of the form `/<assetsDir>/<name>` (e.g. `/_astro/foo-….webp`).
 * Regeneration is skipped when the content-hashed target already exists in
 * the staging dir (deterministic, build-time caching; en/es bodies reuse the
 * same files).
 *
 * Markup contract (mirrors BlurredPicture.astro + the gatsby-remark-images
 * maxWidth-1000 behavior; satisfies scripts/image-audit.mjs):
 *   - avif + webp <source> srcsets at [400, 800, 1000]w, every candidate
 *     capped at the source width (never upscaled; the spec's ≤1000px cap),
 *   - <img> fallback = largest webp variant with intrinsic width/height
 *     attributes (aspect ratio preserved, no layout shift), lazy + async,
 *   - a blurred placeholder layer (32px webp, background-image + blur filter)
 *     emitted BEFORE the <picture>, inline styles like BlurredPicture's
 *     .blurred-picture__layer,
 *   - NO anchor to the original file: a markdown image that is the only child
 *     of <a href="…image…"> gets unwrapped; anchors pointing elsewhere are
 *     kept around the picture (they never link the original file).
 *
 * Sources resolve against the markdown file's directory (vfile.path) and are
 * looked up in an eager import.meta.glob of every image under /content/works —
 * the glob is transformed by Astro's config loader (verified at apply on a
 * 10-cover probe). Only the glob KEYS are used (project-root-absolute paths,
 * resolved to disk); the metadata transform of the values is irrelevant here.
 * Unknown/remote/data-source <img>s and raw-HTML images are left untouched.
 *
 * Paths resolve against process.cwd() (builds run from the repo root).
 * astro.config.mjs does not override `outDir`/`build.assets`, so the
 * dist/_astro defaults match the effective Astro build config.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve, sep } from 'node:path'
import sharp from 'sharp'


// Every image referenceable from work markdown bodies (D4: "images under the
// work dir"). Keyed by project-root-absolute path (/content/works/…).
const imageGlob = import.meta.glob(
  '/content/works/**/*.{png,jpg,jpeg,webp,gif,avif}',
  { eager: true, import: 'default' },
)

const WIDTHS = [400, 800, 1000] // gatsby-remark-images maxWidth 1000 — the ≤1000px cap
const BLUR_WIDTH = 32
const BLUR_QUALITY = 20
const VARIANT_QUALITY = { avif: 70, webp: 80 }
const SIZES = '(min-width: 1000px) 1000px, 100vw'
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif)$/i

function rootKey(filePath) {
  // vfile.path is absolute (/…/content/works/i-o/index.md) — the glob keys
  // are /content/…; strip the absolute prefix up to the first path segment
  // after the root, keeping '/content/works/…' format.
  const idx = filePath.indexOf(`${sep}content${sep}works${sep}`)
  return idx === -1 ? null : filePath.slice(idx).split(sep).join('/')
}

function isRelative(src) {
  return typeof src === 'string' && !/^(https?:|data:|\/)/.test(src)
}

function isLocalImageHref(href) {
  return typeof href === 'string' && isRelative(href) && IMAGE_EXT_RE.test(href)
}

function stableStem(filePath) {
  return basename(filePath, extname(filePath)).replace(/[^a-z0-9._-]+/gi, '-')
}

// Per-source memo: content hash + intrinsic dimensions. en/es bodies render
// the same image twice per build and a source may be referenced from several
// markdown files, so this avoids re-reading/re-measuring every occurrence.
const sourceInfo = new Map()
async function infoFor(srcPath) {
  let info = sourceInfo.get(srcPath)
  if (info) return info
  const [bytes, meta] = await Promise.all([
    readFile(srcPath),
    sharp(srcPath).metadata(),
  ])
  if (!meta.width || !meta.height) {
    throw new Error(`no intrinsic dimensions for ${srcPath}`)
  }
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
  info = { hash, width: meta.width, height: meta.height }
  sourceInfo.set(srcPath, info)
  return info
}

/**
 * Generate (or reuse from a previous run) every variant file for one source
 * image; returns the public URLs plus intrinsic dimensions. Filenames are
 * content-hashed and carry width/format, so an existing file always matches
 * the current transform — regeneration is skipped (build-time cache).
 */
async function makeVariants(srcPath, assetsDirAbs, assetsDir) {
  const { hash, width, height } = await infoFor(srcPath)
  const widths = WIDTHS.filter((w) => w <= width)
  if (widths.length === 0) widths.push(width) // small source: intrinsic-only candidate
  await mkdir(assetsDirAbs, { recursive: true })
  const base = `${stableStem(srcPath)}-${hash}`
  const url = {}

  for (const w of widths) {
    for (const format of ['avif', 'webp']) {
      const name = `${base}-${w}w.${format}`
      const file = join(assetsDirAbs, name)
      if (!existsSync(file)) {
        const buffer = await sharp(srcPath)
          .resize(w, null, { withoutEnlargement: true })
          [format]({ quality: VARIANT_QUALITY[format] })
          .toBuffer()
        await writeFile(file, buffer)
      }
      url[`${format}${w}`] = `/${assetsDir}/${name}`
    }
  }

  // Blur-up placeholder: tiny webp at low quality (BlurredPicture technique).
  const blurName = `${base}-blur.webp`
  const blurFile = join(assetsDirAbs, blurName)
  if (!existsSync(blurFile)) {
    const buffer = await sharp(srcPath)
      .resize(BLUR_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: BLUR_QUALITY })
      .toBuffer()
    await writeFile(blurFile, buffer)
  }
  url.blur = `/${assetsDir}/${blurName}`

  // <img> fallback: the largest webp variant (all modern browsers pick a
  // <source>; the fallback only serves non-<picture> clients).
  url.fallback = url[`webp${widths.at(-1)}`]
  return { url, width, height, widths }
}

function blurLayer(blurUrl) {
  return {
    type: 'element',
    tagName: 'span',
    properties: {
      className: ['md-image__blur'],
      'aria-hidden': 'true',
      style:
        `background-image:url('${blurUrl}');` +
        'background-size:cover;background-position:center;' +
        'position:absolute;inset:0;filter:blur(12px);transform:scale(1.04)',
    },
    children: [],
  }
}

function pictureFor(node, { url, width, height, widths }) {
  const alt = typeof node.properties.alt === 'string' ? node.properties.alt : ''
  const srcset = (prefix) =>
    widths.map((w) => `${url[`${prefix}${w}`]} ${w}w`).join(', ')
  return {
    type: 'element',
    tagName: 'picture',
    properties: {},
    children: [
      {
        type: 'element',
        tagName: 'source',
        properties: { type: 'image/avif', srcset: srcset('avif'), sizes: SIZES },
        children: [],
      },
      {
        type: 'element',
        tagName: 'source',
        properties: { type: 'image/webp', srcset: srcset('webp'), sizes: SIZES },
        children: [],
      },
      {
        type: 'element',
        tagName: 'img',
        properties: {
          src: url.fallback,
          width,
          height,
          alt,
          loading: 'lazy',
          decoding: 'async',
          sizes: SIZES,
          style:
            'position:relative;width:100%;height:auto;display:block;' +
            'object-fit:cover',
        },
        children: [],
      },
    ],
  }
}

export default function rehypeAstroImages(options = {}) {
  console.error('[rehype-astro-images] PLUGIN FACTORY CALLED')
  // `outDir` is honored by the emit-time copy plugin in astro.config.mjs. The
  // rehype plugin itself cannot write straight into `<outDir>/<assetsDir>`:
  // Astro's `emptyDir(outDir)` (static-build.js) runs AFTER content sync and
  // wipes everything written there during markdown render. So variants are
  // staged under `.astro/md-assets/` (never wiped by the build) and the config
  // vite-plugin copies them into `<outDir>/<assetsDir>` at bundle-emit time.
  // `assetsDir` namespaces the staging dir and the public URL, unchanged.
  const assetsDir = options.assetsDir ?? '_astro'
  const stagingDir = join(process.cwd(), '.astro', 'md-assets', assetsDir)

  return async (tree, file) => {
    console.error('[rehype-astro-images] PLUGIN RUNNING path=', file?.path)
    if (!file || typeof file.path !== 'string') return // no md path → cannot resolve sources
    const dir = dirname(file.path)
    const jobs = []

    // Pre-order walk keeping the ancestor chain: unist-util-visit has no
    // ancestors param, and the anchor-unwrap needs the grandparent.
    const collect = (node, ancestors) => {
      if (!node || typeof node !== 'object') return
      if (node.type !== 'element' || !Array.isArray(node.children)) {
        if (Array.isArray(node.children)) {
          for (const child of node.children) collect(child, ancestors)
        }
        return
      }
      if (node.tagName === 'img') {
        const src = node.properties?.src
        if (!isRelative(src)) return
        const resolved = rootKey(resolve(dir, src))
        if (!resolved || !(resolved in imageGlob)) return
        const parent = ancestors.at(-1)
        const index = parent ? parent.children.indexOf(node) : -1
        if (!parent || index < 0) return

        // NO ANCHOR (spec MUST): a markdown image that is the only child of
        // <a href="…image…"> is unwrapped, so the emitted <picture> is never
        // linked to the original file. Anchors pointing elsewhere (pages,
        // posts, videos) are kept — they wrap the picture but do not link the
        // original, which is all the spec forbids.
        let target = parent
        let targetIndex = index
        const grandparent = ancestors.at(-2)
        if (
          parent.tagName === 'a' &&
          parent.children.length === 1 &&
          isLocalImageHref(parent.properties?.href) &&
          grandparent
        ) {
          target = grandparent
          targetIndex = grandparent.children.indexOf(parent)
        }
        jobs.push({ srcPath: join(process.cwd(), resolved), node, target, targetIndex })
        return
      }
      for (let i = 0; i < node.children.length; i++) {
        collect(node.children[i], [...ancestors, node])
      }
    }
    collect(tree, [])

    for (const job of jobs) {
      try {
        const variant = await makeVariants(job.srcPath, stagingDir, assetsDir)
        const wrapper = {
          type: 'element',
          tagName: 'span',
          properties: {
            className: ['md-image'],
            style: 'display:block;position:relative;overflow:hidden;max-width:1000px',
          },
          children: [blurLayer(variant.url.blur), pictureFor(job.node, variant)],
        }
        job.target.children[job.targetIndex] = wrapper
      } catch (err) {
        // One bad image must not blank an entire markdown body (Astro SWALLOWS
        // markdown transformer errors and renders an EMPTY body — the failure
        // mode this rewrite exists to fix). Leave the original <img> in place
        // and fail loudly on stderr; the image-audit count/bare-<img> gates
        // then go red, which is the correct signal.
        console.error(
          `[rehype-astro-images] failed to process ${job.srcPath}: ${err.message}`,
        )
      }
    }
  }
}