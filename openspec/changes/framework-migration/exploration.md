## Exploration: Framework migration off Gatsby

### Current State

**Build & framework**: Gatsby 5.16.1 (React 18.3, TypeScript 5.9 strict) static site. Only quality gate is `yarn typecheck` (`tsc --noEmit`); `tsconfig.json` has `allowJs` off, so only `.ts/.tsx` (index.tsx, seo.tsx, use-site-metadata.tsx) are actually type-checked — most pages are unchecked `.js`. No tests, no linter. Netlify deploys via `netlify.toml` (headers + `NODE_VERSION=22` only — the build command lives in the Netlify UI, not the repo).

**Content**: `content/` = assets (18 pics + profile), cv (cv.en.md, cv.es.md), 10 works (22 markdown files total, 19 in works). **Correction to the stated stack: there is NO MDX and NO gatsby-plugin-mdx** (zero `.mdx` files, zero lockfile entries). Pipeline is pure `gatsby-transformer-remark`.

**Remark chain** (`gatsby-config.ts`): images (maxWidth 1000, no link-to-original), embed-video (`video: <url>` inline-code syntax, 800x1.77), custom `src/plugins/remark-external-links` (target/rel on http links — unist-util-visit based, portable), responsive-iframe, prismjs (inlineCodeMarker `¬`, alias tidal→haskell), copy-linked-files (brings PDFs, mp4/webm relative refs into output), smartypants.

**Image pipeline**: three sources, all through `gatsby-plugin-image`/`gatsby-transformer-sharp`:
- Covers: `cover: "./cover.jpg"` frontmatter → `gatsbyImageData(width: 320, height: 320, layout: FIXED)` on `/work` and labs grid; FULL_WIDTH in work template body via remark images.
- Bio gallery: `content/assets/pics/*.jpg` (17 files) via `StaticQuery` full-file query (`layout: FULL_WIDTH, aspectRatio: 1.5`) + `profile.jpg` (`layout: FULL_WIDTH`) feeding a cyclic-fade client animation.
- Labs: YAML-referenced images `src/data/labs/*.png` via `gatsby-transformer-yaml` + sharp, FIXED 320.
- All gatsbyImageData consumers get sharp-generated responsive srcsets (webp/avif) + blur-up LQIP by default.

**Routing**: `gatsby-node.js` — `createPages` generates `/en|/es/works/{slug}` from markdown (locale derived from filename `name.lang.md`; unlocalized works duplicated to both locales), with previous/next pagination computed from an index of "main" works (canonical = es or unlocalized entry); `onCreatePage` duplicates every static page into `/en/*` and `/es/*`; `matchPath` client-only routes for `/app/*`. Root `/` (index.tsx) client-redirects to `/{lang}/work`. `le.js` redirects to labs/live-emojing. `static/_redirects` maps `/en|/es/labs/bingo` → `/bingo`.

**i18n**: i18next + react-i18next + browser LanguageDetector; translations in `src/translations/{en,es}.json` (~1.1KB/2.4KB); pages duplicated per locale but content text largely keyed via `i18n.languages[0]` at runtime — meaning SSG HTML is English-default and hydration re-renders in browser language (existing client-FOUC behavior). Language switcher swaps the URL prefix for localized routes.

**Labs scope** (owner: low priority, delete/rewrite later): `/labs/ada` (canvas, self-contained — works), `/labs/live-emojing` + `-midi` (React islands; connect to external `wss://av.thundernize.com/websocket` via simpleDDP + isomorphic-ws — dead/partial backend, "partly broken" confirmed in store.js). Static leaf sites in `static/` (algo-rimo, blue-mountain, fmtribe, map-h, cv2612, live-emojing-presentation, en/es/live-emojing) are pure passthrough — unaffected by the framework.

**Sass**: 14 indented-`.sass` files; `gatsby-config.ts` forces `indentedSyntax: true` and silences the `legacy-js-api` deprecation — concrete evidence of the Gatsby 5 sass plugin sitting on deprecated Dart Sass APIs (breaks on Sass 2.0, unmaintained).

### Affected Areas

- `gatsby-config.ts`, `gatsby-node.js`, `package.json`, `netlify.toml`, `tsconfig.json`, `.gitignore` — replaced by the new framework's config surface (astro.config, content config, scripts, build/publish in netlify.toml).
- `src/pages/*` (13 files) + `src/templates/work-post.js` — routes become framework pages; `work-post` becomes a content-collection entry template (frontmatter `style: dashed` on cv2612 → custom schema field).
- `src/components/*` (header×4, footer, link, i18n, provider/context, prettyTime, seo, bio/bioImage+pics, cyclic-fade, emoji, live-emojing×15) — React components port to islands; `Link` (gatsby) → framework link with locale prefix.
- `src/hooks/use-site-metadata.tsx`, `src/components/seo.tsx` — `useStaticQuery`/siteMetadata → config or content-collection metadata.
- `src/pages/labs/index.js`, `src/pages/work.js`, `src/components/bio/{bioImage,pics}.js` — the four `gatsby-plugin-image` consumers (FULL_WIDTH, aspectRatio 1.5, FIXED 320 variants) → Astro `Picture`/`Image`.
- `src/styles/*`, `src/pages/labs/{ada,live-emojing}.sass`, `src/components/cyclic-fade/index.sass` — indented Sass carried over (framework Sass support).
- `src/data/labs.yaml`, `src/data/quotes.json`, `src/translations/*` — YAML/JSON data + i18n resources.
- `src/plugins/remark-external-links/*`, `src/gatsby-types.d.ts` (gitignored, regenerated), `src/workers/*`, `static/*` (passthrough, incl. `_redirects`).

### Approaches

1. **Astro (recommended)** — content collections + remark/rehype + `astro:assets` + React islands.
   - Pros: nearest 1:1 to current semantics; `.md` entries survive with frontmatter intact (cover/style/date/description/`video:` syntax via a tiny remark plugin); `Picture` with `placeholder: "blurred"` + widths/formats (webp/avif) is a credible LQIP/auto-resize equivalent of gatsby-image; existing React components port nearly unchanged as islands (`client:visible` for labs — whole-page React hydration disappears); built-in i18n routing (locales en/es, prefixDefaultLocale reproduces `/en|/es/*`) with i18next kept for keyed text; Vite handles indented Sass; plain static output on Netlify (publish `dist/`, keep `static/` passthrough + `_redirects`); strict TS everywhere and no GraphQL layer to feed.
   - Cons: new framework vocabulary (collections, getStaticPaths, islands) to learn; 4 remark behaviors need porting (prismjs→shiki or rehype plugin incl. `¬` marker+tidal alias, smartypants→retext, responsive-iframe, embed-video `video:` shorthand); page-creation localization logic from gatsby-node must be re-expressed in content-collection terms.
   - Effort: High (mechanical; no deep redesign needed).

2. **Next.js (static export)** — `output: 'export'` + App Router.
   - Pros: excellent `next/image`+sharp; React 19; large ecosystem.
   - Cons: no first-party plain-markdown content collections — hand-rolled gray-matter+remark pipeline re-invents what Gatsby's plugin layer did; markdown-embedded relative images feeding `next/image` requires custom rehype work (no automatic "optimize all markdown images" equivalent); **i18n routing config is unsupported with static export** → manual locale-prefixing code (same burden as current gatsby-node, but handwritten); server features (ISR/middleware/runtime image optimization) are unusable on static Netlify hosting, so Next's core value is wasted for this site; full App Router rewrite of 13 pages + React 19 upgrade.
   - Effort: High to Very High.

3. **Eleventy (11ty)** — zero-JS static generator.
   - Pros: dead-simple markdown, small footprint, eleventy-img+sharp for widths/formats.
   - Cons: no React island story — all 25+ components (including live-emojing/ada/cyclic-fade) must be rewritten outside React; no built-in blur-up placeholder (manual LQIP); i18n and remark chain assembly all custom; highest component rework cost.
   - Effort: High, with the most rewrite.

4. **Stay on Gatsby (no-op)** — listed for honesty.
   - Pros: zero immediate work.
   - Cons: upstream unmaintained; sass plugin already on deprecated APIs with a pinned `sass ~1.79` workaround; no path forward; this is the reason the owner is moving.
   - Effort: N/A (blocked by owner's hard requirement).

### Recommendation

**Migrate to Astro (approach 1).** For a static, content-light, React-component-heavy personal site, Astro gives the closest semantic mapping: content collections preserve the remark surface, `astro:assets` via sharp covers the owner's top constraint (auto resize + blur-up placeholders — `Picture` + `placeholder: "blurred"` + widths/formats), and React islands preserve the existing labs/bio investment while removing whole-page hydration. Next.js only pays off with server features this site cannot use on static Netlify hosting, and its markdown+image-in-markdown story is strictly more manual. Eleventy maximizes rewrite. Whitespace: keep `sass` dep, port `_redirects`, move build command into `netlify.toml`.

Suggested slice order (for the tasks forecast): skeleton+routing parity → content collections (works/cv slug+locale+prev/next semantics) → image pipeline (covers, pics gallery, profile, labs images, markdown images) → remark/rehype plugin ports + styles → labs islands + static passthrough + deploy config. Labs live-emojing (wss to dead server) is inventory-only, non-blocking, per owner.

### Risks

- **Route/slug parity**: unlocalized-vs-localized slug normalization and the "main works index" canonical-selection/previous-next logic in gatsby-node must be reproduced exactly; mistakes silently break URLs/SEO and cross-links between works posts.
- **Image behavior parity**: per-consumer variants (FULL_WIDTH pics, aspectRatio 1.5, FIXED 320 covers, maxWidth 1000 in-markdown) must map to equivalent `Picture` configs; small visual/CLS differences possible — acceptable per owner (credible equivalence, not pixel parity). Research phase should pin the exact "blurred" placeholder generation behavior.
- **Markdown micro-syntax**: `video:` embed shorthand, `¬` prismjs inline marker, tidal alias, external-links decoration, `<video>` relative sources + copy-linked-files behavior — each needs a ported/equivalent plugin or a small content conversion (22 files; owner accepts rewrite if materially simpler).
- **Deploy config drift**: build command is not in the repo (Netlify UI). The migration must add build + publish dir to `netlify.toml`, or the "migrated" repo silently keeps building Gatsby.
- **Review budget**: full migration will vastly exceed the 400-line budget — delivery strategy `ask-on-risk` must resolve to chained PRs (this is a forecast flag for sdd-tasks).
- **openspec not bootstrapped**: `openspec/` did not exist; only `.gitignore` allows exploration.md path there. `config.yaml`/`specs/` are sdd-init's job — init or accept exploration artifact only.

### Ready for Proposal

**Yes.** Evidence is sufficient to propose an Astro migration with the owner's constraints mapped. The orchestrator should (a) confirm Astro as the target (vs Next.js — only if the owner ever wants server-side features, which static Netlify hosting rejects today), (b) surface that the build command must be repatriated into `netlify.toml`, and (c) note that version numbers and Astro/Next image-and-i18n specifics in this comparison are repo-evidence-based and need research-phase validation (per instructions, no web verification was performed here).

-- Framework comparison at a glance (parity against this repo's requirements) --

| Capability | Gatsby today | Astro | Next.js (static export) | Eleventy |
|---|---|---|---|---|
| Auto resize + blur-up (images) | gatsby-plugin-image + sharp | `astro:assets`/`Picture` — placeholder `blurred`, widths, webp/avif (credible parity) | next/image + sharp (excellent, but manual for markdown images) | eleventy-img (widths/formats; no built-in LQIP) |
| Markdown/remark chain | gatsby-transformer-remark + 7 plugins | content collections + remark/rehype ecosystem (closest mapping) | hand-rolled pipeline, no first-party collection for plain .md | remark via plugins, manual assembly |
| React components (labs/bio) | full-page React | React islands (preserved as-is) | React (App Router rewrite + React 19) | rewrite outside React |
| i18n routing (/en|/es) | gatsby-node duplication | built-in i18n routing or keep pattern | config unsupported with static export → manual code | manual |
| Sass indented | plugin on deprecated API (pinned sass 1.79) | native Vite Sass | native Sass | passthrough |
| Netlify static | current | static dist + passthrough | export static; runtime image opt unavailable | static output |
| External validation needed | — | current Astro minor, @astrojs/react versions, i18n routing details | current Next major, export/i18n constraints as of 2026 | 3.x status |

(Exact framework version numbers as of 2026, Astro image-placeholder details, and Next export-i18n constraints were NOT web-verified per exploration scope — the research phase (`sdd-research`) is the place for source-backed confirmation.)