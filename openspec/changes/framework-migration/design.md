# Design: Framework migration — Gatsby → Astro

## Technical Approach

Static Astro 6 (proposal approach 1): `content/` and indented `.sass` stay, React 19 becomes islands. `gatsby-node.js` localization re-expresses via the content layer → `getStaticPaths`; the remark chain ports to remark/rehype; `static/` passthrough via `publicDir`; build command returns to `netlify.toml`. Correctness is enforced by the Gatsby-oracle parity backbone (D10).

## Architecture Decisions

### D1 Astro 6 + Content Layer

Legacy `src/content/config.ts` was **removed in Astro v6** — rejected. Chosen: `src/content.config.ts` + `glob({ pattern:'**/*.md', base:'./content/works' })`; schema callback supplies `image()` for covers. Config: `@astrojs/react`, `publicDir:'./static'`, `i18n`, markdown block.

Deps +: `astro@^6`, `@astrojs/react` (React-19-compatible minor), `sharp`, `remark-smartypants`, `rehype-raw`, `@astrojs/check`, `react@^19`, `react-dom@^19`, `@types/react@^19`, `@types/react-dom@^19`. Keep: `sass`, `react-i18next`, `i18next`, `unist-util-visit`, `tone`, `simpleddp` + labs deps (emoji-mart, react-icons, audio). Drop all `gatsby*`, `prismjs`. Scripts keep names: `typecheck`→`astro check`, `build`→`astro build`. React 19 rides the migration; larger islands blast radius accepted (peer-deps verified at apply).

### D2 Locale / slug / prev-next parity (top risk — exact mapping)

Works are `index.md`/`index.{en,es}.md`; `i-o/` adds `poem.{en,es}.md` + `presentation.md`. Reproduce `gatsby-node.js` verbatim:

```
locale  = name.split('.')[1] if name has '.', else ''
slug    = /{folder}/{relDir}/{name}/ ; localized → strip '.{lang}' then '/index'
index   = name.startsWith('index')        # i-o/poem.* → false
routes  = locale '' → /en+slug AND /es+slug; else /{locale}+slug
```

`main_works` = locale ∈ {es,''} AND index=true, date DESC. Per work: `i` = last idx where `slug.startsWith(main[i])` (default 0 → poems get prev=`main[1]`, next=null); previous=`main[i+1]`, next=`main[i-1]`; locale variants share neighbors.

Astro: one `works` collection derives locale/index/slug identically; `[lang]/works/[...slug].astro` `getStaticPaths` emits `{params:{lang,slug}}` (unlocalized keeps `index` segment). RED test: `scripts/route-map.mjs` diffs golden map vs `dist/`.

### D3 i18n

Astro built-in `i18n: { defaultLocale:'en', locales:['en','es'], routing:{ prefixDefaultLocale:true } }`; `Astro.currentLocale` + `getRelativeLocaleUrl` drive the switcher; v6 `redirectToDefaultLocale:false` default preserves the manual `/` browser-language client redirect (parity with `index.tsx`). Manual-prefix alternative rejected. i18next stays **inside islands only**, `lng` from URL locale — SSG HTML now emits correct language (kills client-FOUC). `/` → `index.astro` inline script; `/le` → `[lang]/le.astro`; missing key → fallback `en`.

### D4 Image parity

| Consumer | Gatsby today | Astro port |
|---|---|---|
| Work covers | FIXED 320 | schema `image()` → `<Picture widths={[320]} sizes="320px" formats={['avif','webp']} placeholder="blurred">` |
| Labs grid | YAML→FIXED 320 | `import.meta.glob('../data/labs/*.{png,jpg}',{eager:true})` by filename → Picture `[320]` |
| Bio pics (17) / profile | FULL_WIDTH, 1.5 AR | `import.meta.glob('/content/assets/pics/*',{eager:true})` → Picture `[420,840,1680]`, `sizes="100vw"`, `aspectRatio={1.5}` (profile: no AR), inside cyclic-fade island |
| Markdown images | maxWidth 1000, no link | `rehype-astro-images`: `getImage()` per relative src → `<picture>` ≤1000, blurred, **no anchor** |

### D5 Remark/rehype port matrix

| gatsby plugin | Astro port |
|---|---|
| `gatsby-remark-images` | `rehype-astro-images` (D4) |
| `gatsby-remark-embed-video` | `remark-video-embed`: inlineCode `^video: (.+)$` → YT/Vimeo iframe 800×450; no URL → unchanged |
| custom `remark-external-links` | rehype port verbatim (`target=_blank`, rel `nofollow noopener`; internal untouched) |
| `gatsby-remark-responsive-iframe` | rehype port: aspect-ratio wrapper (margin 1.0725rem) |
| `gatsby-remark-prismjs` (¬, tidal) | shiki `langAlias:{tidal:'haskell'}`, theme `one-dark-pro` + rehype strips `LANG¬` from inline `code`; drop prism-tomorrow.css — visual delta accepted (owner) |
| `gatsby-remark-copy-linked-files` | rehype port: relative `a[href]`/`video`/`source[src]` (mp4/webm/pdf) → copy to `static/` content-hash renamed, URL rewritten; missing file → build error |
| `gatsby-remark-smartypants` | `remark-smartypants` |

Add `rehype-raw` so element plugins see raw-HTML `<iframe>`/`<video>` (i-o webm, visuals mp4, live-coding iframe).

### D6 Islands

Layout → `Main.astro` (header/footer/nav as Astro components, keyed text at build). React 19 islands `client:visible`: bio Pics (cyclic-fade unchanged), labs/ada canvas, labs/live-emojing + -midi (dead `wss` → shell + feedback; build stays green). Islands mount via `@astrojs/react` `createRoot` — no legacy `ReactDOM.render`; peer-deps (react-i18next, emoji-mart/react, react-icons) must accept React 19 (verified at apply). No whole-page hydration.

### D7 Sass

Keep `sass`; Vite auto-detects indented `.sass` on the modern compile API — drop `gatsby-plugin-sass`, `~1.79` pin, `legacy-js-api` silencing.

### D8 Deploy

`netlify.toml` slice-0: `[build] command="yarn build" publish="dist"`; keep `[[headers]]` + `NODE_VERSION=22`. `static/` untouched; add `/app/* /app/ 200` rewrite for the client-only app shell.

### D9 Slices (forecast HIGH → chained PRs, ask-on-risk)

0 oracle capture: build last-green Gatsby `main`, commit `scripts/oracle/snapshot.json` · 1 skeleton+routing (~350) · 2 content collections (~300) · 3 image pipeline (~250) · 4 remark ports+styles (~300) · 5 labs islands+verify (~250). Each slice: autonomous start/finish, own verify (typecheck+build+route diff), reversible, and runs `parity-check.mjs` scoped to its affected routes; slice 5 runs the full-site parity gate pre-merge.

### D10 Oracle-based parity verification

The migration validation backbone: repeatable comparison against the last-green Gatsby output. Byte identity is out of scope — semantic parity (route set + visible text + image behavior) is what the site owns; hash-named assets and markup differences make byte parity impossible.

| Option | Tradeoff | Decision |
|---|---|---|
| Golden HTML copies | brittle; asset hashes churn every build | rejected |
| Hand-maintained route list | silent drift; no text/image proof | rejected |
| Semantic snapshot diff | paths+text+image inventory; regenerable; rollback proof | **chosen** |

`scripts/capture-oracle.mjs` builds `main` (Gatsby) and emits a compact JSON snapshot: emitted HTML file-path set (incl. `/index/` quirk, `i-o/poem.*`), per-page normalized visible text, per-page image inventory (resolved refs, srcset, blurred placeholder). `scripts/parity-check.mjs` diffs an Astro `dist/` vs the committed snapshot: path set MUST match exactly; per-page text roughly equal after normalization; every image ref resolves with srcset + blurred placeholder. **Allowlist (never regressions)**: i18n FOUC removal (Astro serves correct-locale static HTML vs Gatsby English-default + client re-render); hash-named asset filenames (compare paths+text, never bytes); shiki theme markup/classes vs prism; `astro-island` markers; React 19 markup differences. Captured on demand (per-slice / pre-merge); regenerating from the last-green-Gatsby commit exposes Gatsby-side drift and doubles as rollback proof.

## Data Flow

    last-green Gatsby main ──capture-oracle.mjs──▶ scripts/oracle/snapshot.json (committed)
                                                          ▲
    Astro dist/ ──parity-check.mjs──▶ diff ──▶ pass/fail ┘  (per-slice scoped; full-site pre-merge)

## File Changes

| File | Action | Description |
|---|---|---|
| `astro.config.mjs`, `src/content.config.ts`, `src/env.d.ts`, `src/layouts/Main.astro`, `src/data/site.ts` | Create | config, typed collections, metadata source (replaces siteMetadata + `use-site-metadata.tsx`) |
| `src/pages/` (index, `[lang]/*`, `[lang]/works/[...slug]`, `[lang]/labs/*`, `app/`, `404`) | Create | route surface (~11 files replacing 13 pages + 2 templates) |
| `src/plugins/` (6 ports), `scripts/route-map.mjs` | Create | plugin ports + routing RED test |
| `scripts/capture-oracle.mjs`, `scripts/parity-check.mjs`, `scripts/oracle/snapshot.json` | Create | oracle capture, parity diff, committed snapshot (D10) |
| `package.json`, `tsconfig.json`, `netlify.toml`, `static/_redirects`, `src/styles/*`, `src/components/{bio,cyclic-fade,live-emojing}/*`, `i18n.js`, `translations/*` | Modify | deps/scripts (React 19), build+publish, `/app/*`, theme hooks, islands, URL-locale init |
| `gatsby-config.ts`, `gatsby-node.js`, `src/pages/*` (13), `src/templates/*`, `layouts/main.js`, `src/hooks/*`, `plugins/remark-external-links/`, `gatsby-types.d.ts` | Delete | Gatsby surface replaced |
| `content/`, `static/`, `src/data/{labs.yaml,quotes.json}` | Unchanged | passthrough + data |

## Interfaces / Contracts

```ts
// src/content.config.ts
const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/works' }),
  schema: ({ image }) => z.object({
    title: z.string(), date: z.coerce.date(), description: z.string(),
    cover: image().optional(), style: z.string().optional(), // cv2612: dashed
  }),
})
export const collections = { works, cv }  // cv: glob base './content/cv'
```

`resolveRoutes(works) → [{lang, slugSegments, prev, next}]` (D2) shared by pages and `route-map.mjs`.

```ts
// scripts/oracle/snapshot.json — emitted by capture-oracle.mjs, read by parity-check.mjs
interface OracleSnapshot {
  meta: { capturedAt: string; commit: string; gatsbyVersion: string }
  routes: Array<{
    path: string    // emitted HTML file path, e.g. "en/work/index.html"
    text: string    // whitespace-collapsed visible text
    images: Array<{
      src: string   // resolved asset reference
      srcset: boolean      // responsive srcset present
      placeholder: boolean // blurred placeholder present
    }>
  }>
}
```

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Oracle parity (PRIMARY) | route path-set, per-page text, image inventory vs last-green Gatsby | `parity-check.mjs` vs committed snapshot; per-slice scoped, full-site pre-merge |
| Typecheck + Build | schema, islands, plugins, assets | `yarn typecheck` (`astro check`) + `yarn build` (verify gates) |
| Route parity | golden map vs `dist/` (incl. `/index/` slugs, poems) | `route-map.mjs` RED test — slice-local fast feedback; oracle path-set is the pre-merge authority |
| Markdown goldens | live-emojing (¬/tidal), cv2612 (image+style), i-o (video:+webm), visuals (mp4), live-coding (iframe); audit avif+webp, blurred, no md-image link | snapshot diffs + grep |
| Deploy | build command, publish dir, `_redirects` in dist | netlify.toml audit |

No test runner (config): RED tests are scripts; verify = typecheck + build + route diff + goldens + oracle parity.

## Threat Matrix

Routing boundary present (getStaticPaths, `_redirects`, build command) — RED test = route-map golden diff, with oracle parity-check as the authoritative path-set gate. Parity scripts spawn builds via fixed script names only; no user input reaches a command line. All adversarial rows N/A:

| Boundary | Applicability | Reason |
|---|---|---|
| Documentation-like paths | N/A | no executable docs / classification logic |
| Git repository selection | N/A | no VCS invocation in shipped code |
| Commit state | N/A | idem |
| Push state | N/A | idem |
| PR commands | N/A | PR automation is SDD workflow, not change code |

## Migration / Rollout

Slices per D9; `main` stays Gatsby until the final slice merges. Oracle snapshot captured from last-green Gatsby `main` before slice 0 — committed, regenerable (a regeneration diff proves Gatsby drift and is rollback proof). `netlify.toml` build/publish lands slice-0 (UI drift guard). Rollback: revert merge → `main` redeploys last green Gatsby. No data migration — content is read, never rewritten.

## Open Questions

- [ ] Research before apply (precondition): pin exact `astro@^6` minor and `@astrojs/react` minor compatible with React 19; confirm island peer deps (react-i18next, emoji-mart/react, react-icons) accept React 19
- [ ] manifest/google-fonts dropped (manifest absent; Inconsolata via `<link>`) — confirm acceptable