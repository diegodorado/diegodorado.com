// @ts-check
import { defineConfig } from 'astro/config'
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import react from '@astrojs/react'
import { unified } from '@astrojs/markdown-remark'
import rehypeVideoEmbed from './src/plugins/rehype-video-embed.mjs'
import rehypeAstroImages from './src/plugins/rehype-astro-images.mjs'

// Single source of truth for the in-markdown image pipeline output location.
// The rehype plugin stages variants under .astro/md-assets/ during markdown
// render (Astro's emptyDir(outDir) in static-build.js wipes any direct write
// into the output dir later in the build), and this vite-plugin copies the
// staged files into <outDir>/<assetsDir> at bundle-emit time — the same spot
// Astro's own image assets land, so the public URLs match.
const MD_IMAGES = { outDir: 'dist', assetsDir: '_astro' }

/** @param {{ outDir: string; assetsDir: string }} opts */
function mdAssetsCopyPlugin({ outDir, assetsDir }) {
  return {
    name: 'md-image-assets-copy',
    apply: 'build',
    writeBundle() {
      const src = join(process.cwd(), '.astro', 'md-assets', assetsDir)
      const dest = join(process.cwd(), outDir, assetsDir)
      if (!existsSync(src)) return
      mkdirSync(dest, { recursive: true })
      for (const name of readdirSync(src)) {
        const from = join(src, name)
        const to = join(dest, name)
        if (!existsSync(to)) cpSync(from, to)
      }
    },
  }
}

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  // static/ passthrough (D8): files copied verbatim to dist, incl. _redirects.
  publicDir: './static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      // Locale-prefixed routes /en/*, /es/* (D3).
      prefixDefaultLocale: true,
      // No auto-redirect/rewrite of unprefixed routes: `/` keeps the manual
      // browser-language client redirect, parity with the Gatsby index page.
      redirectToDefaultLocale: false,
    },
  },
  markdown: {
    // Deprecated `markdown.rehypePlugins` shim does NOT reach content-layer
    // renders in Astro 6.4.8 (verified empirically); the processor form is the
    // mechanism the content layer actually reads.
    processor: unified({
      remarkPlugins: [],
      rehypePlugins: [
        /** @type {any} */ (rehypeVideoEmbed),
        /** @type {any} */ (rehypeAstroImages(MD_IMAGES)),
      ],
    }),
    // Full remark/rehype ports (D5) land in the imagery/remark slice.
  },
  vite: {
    plugins: [/** @type {any} */ (mdAssetsCopyPlugin(MD_IMAGES))],
  },
})