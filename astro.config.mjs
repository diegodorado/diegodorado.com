// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

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
  image: {
    // Responsive images by default: Astro generates srcset/sizes and applies
    // default styles for all <Image /> / <Picture /> components and Markdown
    // images. Per-image override via the `layout` prop when needed.
    layout: 'constrained',
    responsiveStyles: true,
  },
})
