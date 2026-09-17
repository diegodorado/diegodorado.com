# Research: Framework migration — Gatsby → Astro 6

Change: `framework-migration` (Gatsby 5.16.1 → Astro 6)
Phase: sdd-research — read-only reference consumed by tasks 1.1 (skeleton gate) and 5.1 (islands gate)
Research date: 2026-09-16
Evidence grants used: `documentation` (Context7 MCP — official Astro/emoji-mart docs and the withastro/astro 6.3.1 repository index); local read-only package metadata (`package.json`, `yarn.lock`, source files). `open-web` (live npm registry JSON) was not available in this environment: any claim that would require a direct registry fetch is marked **UNVERIFIED** below rather than estimated from training memory.

Status legend: **VERIFIED** = current source-backed evidence obtained and dated; **UNVERIFIED** = not verifiable from this environment (registry access absent); no training-memory estimates used as evidence.

---

## Lane 1 — Astro 6 baseline

### 1.1 Version pin candidate

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| Newest `astro@6` version present in the evidence index is **6.3.1** | Context7 `/withastro/astro` version list: `astro_6.3.1`; repository tree tagged `astro@6.3.1` (e.g. `packages/astro/CHANGELOG-v6.md` tracked on `main`) | https://www.context7.com/withastro/astro (index); https://github.com/withastro/astro (tag astro@6.3.1) | 2026-09-16 |
| The Astro 6 line is still maintained (v6 changelog lives on `main`) | `packages/astro/CHANGELOG-v6.md` with v6 minor entries (queued rendering, markdown processor, fonts npm provider, `getRemoteSize()`) | https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG-v6.md | 2026-09-16 |
| A newer major exists (Astro 7), and v7 did not change the Node minimum vs v6 | "Astro v7 did not change the minimum Node.js version requirement. It remains v22.12.0 (unchanged from v6...)" | https://github.com/withastro/docs/blob/main/src/content/docs/en/install-and-setup.mdx | 2026-09-16 |

**Precision note (Hall UNVERIFIED):** "exact latest `astro@^6.3.x` published to npm today" is **UNVERIFIED** — no registry access from this environment. Pin `astro@^6.3.1` in `package.json`; task 1.1 gate re-checks `yarn info astro dist-tags` before install. The intent of the change pins `^6` (proposal), so the v7 existence above does not change the target; recorded as a risk (see Risks).

### 1.2 Minimum Node version

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| `astro@6` requires **Node v22.12.0 or higher** (v6 dropped Node 18 and 20); odd versions (v23) unsupported | "Astro v7 did not change the minimum Node.js version requirement. It remains v22.12.0+ (unchanged from v6, which dropped Node 18 and 20). Odd-numbered versions like v23 are not supported." | https://github.com/withastro/docs/blob/main/src/content/docs/en/install-and-setup.mdx | 2026-09-16 |
| Current project satisfies it: `package.json` `engines.node: "22.x"`, Netlify `NODE_VERSION=22` (design D8) | repo `package.json` line 18–20 | local read | 2026-09-16 |

### 1.3 Content-layer change (v6 hard break, not just deprecation)

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| **`src/content/config.ts` is REMOVED in v6.** Astro emits a hard error: `Found legacy content config file in "src/content/config.ts". Please move this file to "src/content.config.ts" and ensure each collection has a loader defined.` — legacy content collections were removed in v6 | Astro error data source in the 6.x tree: `packages/astro/src/core/errors/errors-data.ts`; upgrade guide v6 | https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts ; https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/upgrade-to/v6.mdx | 2026-09-16 |
| The `type: 'content' / 'data'` property is removed in v6 (`ContentCollectionInvalidTypeError`); collections use an explicit `loader` | v6 upgrade guide | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/upgrade-to/v6.mdx | 2026-09-16 |
| Current pattern: `src/content.config.ts`, `defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './...' }), schema })`, `export const collections` | content-collections guide (current), including `schema: ({ image }) => z.object({ cover: image().optional() })` | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/content-collections.mdx | 2026-09-16 |

Design direction confirmed: task 2.1 (`src/content.config.ts`, `glob()` for works/cv, `image()` cover, `style`) matches the documented v6 pattern exactly. The design's "Legacy `src/content/config.ts` was removed in Astro v6 — rejected" decision is correct and source-backed.

### 1.4 Output static default + adapter

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| `output` default is **`'static'`** (type `'static' \| 'server'`); v5 removed `'hybrid'` — `'static'` is the name for all-prerendered output | configuration-reference: "**Default:** `'static'`"; v5 upgrade guide: hybrid removed, previous hybrid behavior is now the default under the name `'static'` | https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/configuration-reference.mdx ; https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/upgrade-to/v5.mdx | 2026-09-16 |
| Static sites need **no adapter**; an adapter is only required for server-rendered pages (error/warning without it) | v5 upgrade guide + Netlify guide ("For static sites (`output: 'static'`) hosted on Netlify, you usually don't need an adapter") | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/integrations-guide/netlify.mdx | 2026-09-16 |

Design direction: no adapter in deps (proposal "adapter none needed for static") is correct; `netlify.toml` `publish="dist"` + default static output suffice.

### 1.5 CLI

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| `astro check` is an **external command** since v3: requires `@astrojs/check` AND `typescript` as project deps | v3 upgrade guide (the mechanism is unchanged through v6) | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/upgrade-to/v3.mdx | 2026-09-16 |

Design direction: `typecheck` → `astro check` + deps `@astrojs/check` (+ existing `typescript`) is correct. Once `@astrojs/react` is installed, `astro check` also type-checks the JSX islands (presence of `tsconfig.json` required — task 1.4).

### 1.6 Other v6 diffs relevant to this migration

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| v6 default image service **crops by default when `width` and `height` are provided** (previous `fit="contain"` behavior removed) | v6 upgrade note: `<Image src={photo} width={400} height={300} />` = cropped; `fit="contain"` can be deleted | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/upgrade-to/v6.mdx | 2026-09-16 |
| v6 `getRemoteSize()` added to the Image Service API (not migration-relevant; recorded for completeness) | v6 changelog | https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG-v6.md | 2026-09-16 |

---

## Lane 2 — `@astrojs/react` integration

### 2.1 Role and config

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| `@astrojs/react` provides SSR + client-side hydration for React components inside Astro; wired as `integrations: [react()]` in `astro.config.*` | integration README in the 6.3.1 tree: "enables server-side rendering and client-side hydration for React components within an Astro project"; react integration guide | https://github.com/withastro/astro/blob/astro@6.3.1/packages/integrations/react/README.md ; https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/integrations-guide/react.mdx | 2026-09-16 |
| `react` and `react-dom` are **peer dependencies of the integration** — must be installed in the project ("Cannot find package 'react'" when missing; not all package managers auto-install peers) | docs troubleshooting | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/troubleshooting.mdx | 2026-09-16 |
| Exact `@astrojs/react` version compatible with `astro@^6` | **UNVERIFIED** — no registry access. The 6.3.1 repo tree contains the integration, but its npm release cadence is independent of `astro`. Pin at apply: task 1.1 gate runs `yarn info @astrojs/react version peerDependencies` and pins the minor before install. | — | — |

### 2.2 Island mounting mechanism

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| `client:visible` hydrates when the element enters the viewport; `client:load` on page load; `client:only` renders client-only; all `client:*` components first render static HTML on the server (except `client:only`) | framework-components guide + CLI semantics | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/framework-components.mdx | 2026-09-16 |
| Each hydrated component instance becomes an `<astro-island>` custom element (attrs `component-url`, `renderer-url`, `component-export`, `props`, `ssr`, `client`, `opts`) that loads its module and hydrates in isolation | 6.x runtime source: `packages/astro/src/runtime/server/hydration.ts` | https://github.com/withastro/astro/blob/main/packages/astro/src/runtime/server/hydration.ts | 2026-09-16 |
| The React renderer hydrates the server-rendered island markup via the integration's client entry (the design D6 statement that mounting goes through `@astrojs/react` and **not** legacy `ReactDOM.render` is consistent with the integration's documented responsibility; the precise `createRoot` call site is inside the integration's client renderer) | integration README (renderer responsibility) + hydration.ts (renderer-url per island) | https://github.com/withastro/astro/blob/astro@6.3.1/packages/integrations/react/README.md | 2026-09-16 |

**UNVERIFIED sub-item:** the internal `createRoot`/renderer code path of `@astrojs/react` for the pinned minor was not directly observable in the index. Nothing in the evidence contradicts design D6 ("islands mount via `@astrojs/react`, no legacy `ReactDOM.render`"), which matches the integration's documented contract; treat "React 19 support statement for `@astrojs/react`" (lane requirement) as **UNVERIFIED via docs** — the docs index does not surface an explicit React-19 compatibility line. Pre-apply gate (task 1.1/5.1): `yarn info @astrojs/react peerDependencies` must show `react: ^17.0.2 || ^18.0.0 || ^19.0.0` (or equivalent covering ^19) before installing. `experimental` flags: none are documented as required for standard React islands in the queried guides; no experimental flag surfaced in the integration docs — none recommended.

---

## Lane 3 — React 19 peer-dep acceptance (installed app deps)

Evidence source for installed versions and peer ranges: `yarn.lock` (registry-pinned resolutions with integrity checksums, repo-local, read 2026-09-16). React 19 target: `react@^19` (latest evidence: React `v19.2.7` in the React index).

| Package (installed) | Required peer range for react | Accepts `^19`? | Evidence | Source |
|---|---|---|---|---|
| `react-i18next@17.0.14` | `react: ">= 16.8.0"` (also `i18next >= 26.2.0`; `react-dom`/`react-native`/`typescript` optional peers) | **YES** | yarn.lock L13430–13448 | local lockfile |
| `react-icons@5.7.0` | `react: "*"` | **YES** (any version) | yarn.lock L13452–13459 | local lockfile |
| `emoji-mart@5.6.0` | no react peer (framework-agnostic web component) | **YES** | yarn.lock L6359–6364 | local lockfile |
| `@emoji-mart/data@1.2.1` | no peers (pure data) | **YES** | yarn.lock L1641–1646 | local lockfile |
| `@emoji-mart/react@1.1.1` | `react: "^16.8 \|\| ^17 \|\| ^18"` (also `emoji-mart: ^5.2`) | **NO — BLOCKER** | yarn.lock L1648–1656 | local lockfile |
| `i18next@26.4.2` | no react peer | **YES** | yarn.lock L9372 | local lockfile |
| `react-dom@18.3.1` | `react: ^18.3.1` (replaced in migration by `react-dom@^19`) | n/a (dependency to be upgraded) | yarn.lock L13411–13419 | local lockfile |
| labs deps: `tone@15.1.22`, `simpleddp@2.0.0`, `startaudiocontext@1.2.1`, `isomorphic-ws@5.0.0`, `twemoji-parser@14.0.0`, `graphemer@1.4.0` | no react peers (audio/network/parser utilities) | **YES** | yarn.lock L10321, L14655, L14918, L15627, L15727, L8894 | local lockfile |

### 3.1 Blocker: `@emoji-mart/react`

- **Installed-version evidence:** peer range `^16.8 || ^17 || ^18` (yarn.lock, 1.1.1).
- **Upstream confirmation (independent of the lockfile):** the official emoji-mart docs (main branch, checked 2026-09-16) state the React wrapper "requires React versions 16.8, 17, or 18, and depends on emoji-mart version 5.2 or higher" — https://github.com/missive/emoji-mart/blob/main/_autodocs/api-reference/react-wrapper.md (mirrored at context7 /missive/emoji-mart, React Wrapper reference).
- **Closest compatible version accepting ^19:** **UNVERIFIED** — no registry access; the upstream main-branch docs (as of 2026-09-16) still document 16.8/17/18 only. Design D1's "peer-deps verified at apply" expectation must treat this as a **known blocker**, not a check.
- **Where it mounts:** `src/components/live-emojing/playground.js` L5–6 imports `Picker` from `@emoji-mart/react` + data from `@emoji-mart/data`, rendered at L423 (`<Picker data={data} onEmojiSelect={addEmoji} />`). That file is part of the labs/live-emojing React island (the "message board": wss-based collaborative live board — `src/pages/labs/live-emojing.js`, `playground-midi.js`), which design D6 reduces to "shell + feedback" because the wss endpoint is dead.
- **Evidence-backed options for the apply phase (choice is design/owner-owned):**
  1. Drop `@emoji-mart/react` and drive the picker through the framework-agnostic web components of `emoji-mart@5.6.0` (`<em-emoji-picker>`/`<em-emoji>`; emoji-mart has **no react peer**) — documented at https://github.com/missive/emoji-mart/blob/main/_autodocs/api-reference/emoji-element.md.
  2. If the retained "shell + feedback" island does not mount the Picker at all, remove `@emoji-mart/react` from deps (layout decision).
  3. Do NOT silently keep React 18 (contradicts migration intent).
- **OWNER DECISION (2026-09-16, diegodorado): DROP THE PICKER ENTIRELY.** The live-emojing lab's wss backend is dead; per the proposal, labs experiments are low priority and get deleted/rewritten before migration. `@emoji-mart/react`, `emoji-mart`, and `twemoji-parser` are NOT carried into the Astro dependency surface. The labs/live-emojing island reduces to the design D6 shell without the Picker; if the lab is not retained in that form during slice 5, the corresponding imports are removed with it. Only `@emoji-mart/data` stays IF any retained island still needs it; otherwise it is dropped too. React 19 peer blockers are thereby resolved without keeping React 18.
- **Pure-static usage of the same deps:** none of the other emoji imports (`emoji.js`, twemoji-parser) mount React; `@emoji-mart/data` is data-only and stays.

### 3.2 Islands that actually mount React vs pure-static

React-mounting (become `client:*` islands or are dropped/ported):
- labs/live-emojing + labs/live-emojing-midi ("message board" pages, `src/pages/labs/*`) — React island cluster; imports react-i18next, react-icons, @emoji-mart/react, tone, startaudiocontext, simpleddp, isomorphic-ws, twemoji-parser, graphemer (verified by `import ... from 'react'` grep + module imports in `live-emojing/*.js`).
- labs/ada (`src/pages/labs/ada.js`) — React canvas island.
- bio pics + cyclic-fade (`src/components/bio/{pics,bioImage}.js`, `src/components/cyclic-fade/index.js`) — React island (design D6).
- `src/pages/app.js` — client-only app shell (`@reach/router` NotFound default) — see 3.3.

Pure-static today (server-rendered by Gatsby; become Astro components, no React 19 concern): `index.tsx`, `work.js`, `music.js`, `bio/*`, `404.js`, `le.js`, header/footer/link/emoji/context/provider (`src/components/*`), `seo.tsx` (port to `src/data/site.ts` per D2.6), `use-site-metadata.tsx` (deleted per task 1.5).

### 3.3 Transitive-dependency gotcha (`@reach/router`)

`src/pages/app.js` L2 (`Router`) and `src/components/header/index.js` L7 (`useLocation`) import `@reach/router`, which is **not declared** in `package.json` — it resolves through Gatsby's dependency tree (reach entries exist in yarn.lock). On Astro this resolution disappears; the port must not declare it. `app.js`'s `Router` has a single `NotFound` default route (reads verified), so the `/app/` static shell (D8) needs no Router; the header's `useLocation` is not needed in an SSG header.

---

## Lane 4 — Image pipeline equivalents (astro:assets)

| Gatsby behavior (specs/design) | Astro 6 equivalent | Status | Evidence | Source | Checked |
|---|---|---|---|---|---|
| Squoosh / default image service | **SquooshImageService does NOT exist in v6** — removed in Astro 5.0 (`libsquoosh` unmaintained). Sharp is the built-in **default** service; with a strict package manager, install `sharp` explicitly (design D1 adds it — correct). Sharp is lazy-loaded only when a transform runs (`await import('sharp')` in `loadSharp()`) | **VERIFIED** (Squoosh removed; Sharp default) | v5 upgrade guide; 6.x service source | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/upgrade-to/v5.mdx ; https://github.com/withastro/astro/blob/main/packages/astro/src/assets/services/sharp.ts | 2026-09-16 |
| FIXED 320 covers (work covers, labs grid) | `<Picture widths={[320]} sizes="320px" formats={['avif','webp']}>` — `widths` generates the srcset, `sizes` is **required when `widths` is set**, widths larger than the source are ignored. Exact-sharp `sharp` version paired with astro 6: **UNVERIFIED** (registry) — re-check at install; current transitive `sharp@0.32.6` (via gatsby-plugin-sharp) is NOT evidence for the Astro pairing | VERIFIED (widths/sizes API); UNVERIFIED (sharp version pairing) | astro-assets module reference | https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/modules/astro-assets.mdx | 2026-09-16 |
| FULL_WIDTH aspectRatio 1.5 gallery (bio pics 420/840/1680) | `layout="full-width"` exists (`'constrained' \| 'full-width' \| 'fixed' \| 'none'`, `image.layout` config since v5.10.0) → `sizes="100vw"`. **`aspectRatio` prop: UNVERIFIED in v6 docs** (the prop existed pre-v3, was removed in the v3 `astro:assets` consolidation — verify against installed `astro:assets` types at apply). v6-verified alternative: pass explicit `width`/`height` pairs at the 1.5 ratio (e.g., 420×280, 840×560, 1680×1120); v6's default service **crops by default when width+height are given** (v6 upgrade note), which reproduces the 1.5 crop without an `aspectRatio` prop; `fit`/`position` control the crop origin | VERIFIED (layout, widths/sizes, v6 default crop); UNVERIFIED (aspectRatio prop in v6) | images guide; astro-assets reference; v6 upgrade guide | (same URLs above) | 2026-09-16 |
| Markdown maxWidth 1000, no link | `getImage({ src, width: 1000, ... })` imperative API in a rehype plugin (`rehype-astro-images`) — documented pattern for custom img components; `<img {...optimised.attributes} />`; "no anchor" is plugin logic, not an API constraint | VERIFIED (getImage API + custom-img recipe) | custom-img recipe; astro-assets reference | https://github.com/withastro/docs/blob/main/src/content/docs/en/recipes/build-custom-img-component.mdx | 2026-09-16 |
| Blurred/dominant-color placeholders (`placeholder="blurred"`) | **UNVERIFIED** — the placeholder prop never surfaced in the v6 docs index despite multiple targeted queries. Design D4/D10 depend on it (blurred placeholder in image inventory). Task 3.x gate: check the installed `astro:assets` `Image`/`Picture` prop types (`astro:assets` module reference or `node_modules/astro` types) for `placeholder` before implementing; if absent in v6, the oracle `images[].placeholder` field and D4 need an equivalent (e.g., `background` prop + generated blur CSS, or drop from the allowlist) | **UNVERIFIED** | — | — | 2026-09-16 |
| `<Picture>` multi-format output | `Picture` accepts **all `Image` props** plus `formats` (default `['webp']`), `fallbackFormat`, `pictureAttributes`, `background`; outputs `<picture><source srcset=... avif/webp><img ...>`; `alt` mandatory | VERIFIED | images guide; astro-assets reference | https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/images.mdx | 2026-09-16 |

Imperative vs component API for this Astro 6 minor: use the built-in `astro:assets` components/`getImage` (the legacy `@astrojs/image` integration was removed in v3 — do not add it). Sharp service configurable via `image.service` (`astro/assets/services/sharp`) for `limitInputPixels`/encoder options — VERIFIED (configuration-reference).

---

## Lane 5 — Dependency removal list (package.json rewrite)

Remove (Gatsby-only stack — none are used by any non-Gatsby module in the codebase; verified by `gatsby-config.ts` wiring + imports):

| Dep (declared range) | Reason |
|---|---|
| `gatsby ^5.16.1` | framework itself |
| `gatsby-plugin-google-fonts ^1.0.1` | Inconsolata link replacement — design open question ("confirm acceptable") |
| `gatsby-plugin-image ^3.16.0` | replaced by `astro:assets` |
| `gatsby-plugin-manifest ^5.16.0` | dropped (design open question) |
| `gatsby-plugin-sass ^6.16.0` | replaced by Vite/Sass native (design D7) |
| `gatsby-plugin-sharp ^5.16.0` | replaced by `sharp` direct dep for `astro:assets` |
| `gatsby-remark-copy-linked-files ^6.16.0` | ported rehype plugin (task 4.5) |
| `gatsby-remark-embed-video ^3.2.1` | ported `remark-video-embed` (task 4.1) |
| `gatsby-remark-images ^7.16.0` | ported `rehype-astro-images` (task 3.4) |
| `gatsby-remark-prismjs ^7.16.0` | replaced by shiki (task 4.4) |
| `gatsby-remark-responsive-iframe ^6.16.0` | ported (task 4.3) |
| `gatsby-remark-smartypants ^6.16.0` | replaced by `remark-smartypants` (task 4.6) |
| `gatsby-source-filesystem ^5.16.0` | replaced by `glob()` loaders |
| `gatsby-transformer-json ^5.16.0` | replaced by loaders/data imports |
| `gatsby-transformer-remark ^6.16.0` | replaced by Astro markdown pipeline |
| `gatsby-transformer-sharp ^5.16.0` | replaced by `astro:assets` |
| `gatsby-transformer-yaml ^5.16.0` | replaced by loaders/data imports |
| `prismjs ^1.30.0` | replaced by shiki (design D5) |

Keep (app/labs deps, non-Gatsby): `@emoji-mart/data`, `@emoji-mart/react` (⚠ blocker — see Lane 3), `emoji-mart`, `graphemer`, `i18next`, `i18next-browser-languagedetector` (usage decision is design-owned — D3 URL-locale init may obsolete it), `isomorphic-ws`, `react` (→`^19`), `react-dom` (→`^19`), `react-i18next`, `react-icons`, `sass` (design D7 drops the `~1.79.0` pin), `simpleddp`, `startaudiocontext`, `tone`, `twemoji-parser`, `unist-util-visit`.

Add (design D1): `astro@^6` (pin per Lane 1.1/2.1), `@astrojs/react` (pin per Lane 2.1), `sharp` (direct), `remark-smartypants`, `rehype-raw`, `@astrojs/check` (+ existing `typescript`), `@types/react@^19`, `@types/react-dom@^19`.

Undeclared/transitive — do NOT carry: `@reach/router` (used by `app.js`, `header/index.js`; resolves via Gatsby tree today — see Lane 3.3). `sharp@0.32.6` currently transitive via Gatsby plugins; the direct Astro-paired sharp version gets resolved at install (Lane 4 note).

---

## UNVERIFIED items (explicit)

1. Exact latest `astro@^6.x` npm patch beyond 6.3.1 (registry) — Lane 1.1.
2. Exact `@astrojs/react` version + React-19 peer range for the pinned minor (registry) — Lane 2.1; gate at task 1.1/5.1 via `yarn info`.
3. Explicit "React 19 supported" statement for `@astrojs/react` (docs index) — Lane 2.2; mechanism verified, statement not.
4. Closest React-19-compatible version for `@emoji-mart/react` (registry) — Lane 3.1; the blocker itself is double-source-verified.
5. `placeholder="blurred"` / `dominant-color` and `aspectRatio` props present in the pinned `astro:assets` for v6 — Lane 4; apply-phase type check required before task 3.1/3.3/D4 implementation.
6. `sharp` version range paired with astro 6 (registry) — Lane 4.

Nothing above is estimated from training memory; each flagged item either has a dated upstream source or an explicit apply-phase verification step with the exact command/artifact to check.

## Risks

- **@emoji-mart/react blocks React 19** (double-sourced). Slice 5 (labs islands) and the `react@^19` install in slice 1 both touch it; resolve the choice (drop wrapper → web component; drop picker; keep picker) BEFORE slice 1 dependency rewrite to avoid a mid-change Yarn peer conflict.
- **placeholder/aspectRatio unverified for v6**: D4/D10 image parity code must be written against the installed types; schedule the check inside task 3.1 (covers) before 3.3 (bio) to avoid rework.
- **Astro 7 exists**: `^6` remains the change target; if `astro@^7` gains traction mid-change, revisit with owner (out of scope today).
- **`@reach/router` undeclared import** would break header/app ports silently if carried over.
- **sharp transitive 0.32.6** is Gatsby-era; do not read it as the Astro pairing.

## Sources consulted (all checked 2026-09-16)

- https://github.com/withastro/docs (install-and-setup, content-collections, framework-components, integrations-guide/react, images guide, astro-assets module reference, configuration-reference, upgrade-to v5/v6/v3, build-custom-img-component recipe, troubleshooting, Netlify guide)
- https://github.com/withastro/astro (tag `astro@6.3.1`, `main`): CHANGELOG-v6.md, errors-data.ts, sharp.ts (assets services), hydration.ts, packages/integrations/react/README.md
- https://github.com/missive/emoji-mart (`main`): react-wrapper.md, emoji-element.md, packages/emoji-mart-react README
- https://www.context7.com/withastro/astro (version index: astro_6.3.1), /missive/emoji-mart (index)
- Local (read-only): `package.json`, `yarn.lock` (registry-pinned resolutions + peerDependencies), `gatsby-config.ts`, `src/components/live-emojing/playground.js`, `src/pages/app.js`, React-import grep across `src/`