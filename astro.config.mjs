// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import rehypeVideoEmbed from './src/plugins/rehype-video-embed.mjs'

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
    rehypePlugins: [rehypeVideoEmbed],
    // Full remark/rehype ports (D5) land in the imagery/remark slice.
  },
})