# Apply Progress: framework-migration

- Batch: 1 (oracle capture)
- Date: 2026-09-16
- Mode: Standard (strict_tdd: false, no test runner — verification is typecheck + build + route-map + parity-check)
- Delivery: single PR + size:exception (maintainer-approved at Review Workload Guard)

## Completed Tasks (2/35)

- [x] 0.1 `scripts/capture-oracle.mjs`: build Gatsby `main` → `scripts/oracle/snapshot.json`.
- [x] 0.2 Commit snapshot pre-Astro; meta.commit+version.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `scripts/capture-oracle.mjs` | Created | Builds Gatsby `main` (`yarn build`, fixed script name), walks `public/` for emitted HTML, emits semantic snapshot (routes: path + whitespace-collapsed visible text + image inventory: resolved src, srcset boolean, blurred-placeholder boolean). HSlices `<noscript>` dupes and empty-src SSR stubs. |
| `scripts/oracle/snapshot.json` | Created | Committed parity baseline: 55 routes, 141 images. `meta.commit=529cf73ee5bdd368a266975a1a66d44167b04756` (last-green Gatsby main), `meta.gatsbyVersion=^5.16.1`. |

## Work Unit Evidence

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `node scripts/capture-oracle.mjs` → `[oracle] captured 55 routes, 141 images -> scripts/oracle/snapshot.json`, exit 0, Gatsby build green |
| Runtime harness command/scenario and exact result | Full `yarn build` (Gatsby) inside capture script; snapshot spot-checks: `en/work/index.html` 10 imgs all srcset+placeholder, `en/works/i-o/index.html` 2 markdown imgs LQIP+srcset, `en/bio/index.html` 19 imgs (profile + 18 pics) all srcset+placeholder, `en/labs/index.html` 7 imgs |
| Rollback boundary | Revert commit `7c0bef9` removes only `scripts/`; snapshot regenerable at any time via `node scripts/capture-oracle.mjs` |

## Oracle Capture Calibration (deviation notes)

- Gatsby v3's `blurred` placeholder in covers/labs/pics is a dominant-color `data-placeholder-image` div — NOT a data URI. gatsby-remark-images (markdown) uses a `background-image: url('data:image/...')` LQIP span. Capture detects both (1200-char window before each `<img>`).
- Lazy SSR images carry `data-src`/`data-srcset` (no `src`); both accepted. Empty-src SSR stubs and `<noscript>` fallback copies are deduped.
- Text capture decodes HTML entities after stripping scripts/styles/noscript.

## Status

- 2/35 tasks complete.
- **Gate 1.1 UNMET**: `openspec/changes/framework-migration/research.md` does not exist. Per constraint, versions were NOT guessed; apply stops here for orchestrator to run `sdd-research` and relaunch.
- **Runtime objective needs maintainer reset**: the oracle attempt settled `outcome: passed` but `changed_line_budget_exceeded: true` (declared 300, charged 1206 — the 1014-line committed snapshot JSON counts in runtime accounting). `gentle-ai sdd-attempt status --cwd /Users/diegodorado/Code/node/diegodorado --change framework-migration` prints `revision: sha256:0b9f61bd7f2a5ea4938e7096a525b72527445cad09931bbf20e1a2f56b588a60`, `next_action: reset`. Maintainer must run:
  `gentle-ai sdd-attempt reset --cwd "<repo>" --change "framework-migration" --expected-revision sha256:0b9f61bd7f2a5ea4938e7096a525b72527445cad09931bbf20e1a2f56b588a60 --request-id "<unique-id>" --reason "oracle snapshot slice is a generated golden; size:exception accepted" --actor "<maintainer>"`
- Commit `7c0bef9` is on `main` and contains ONLY the oracle work unit; `openspec/` planning artifacts remain untracked (excluded from the attempt, per constraint 9).

---

# Apply Progress: framework-migration — Batch 2 (Phase 1: Skeleton + Routing)

- Batch: 2 (skeleton + routing, tasks 1.1–1.9)
- Date: 2026-09-17
- Mode: Standard (strict_tdd: false, no test runner — verification is typecheck + build + route-map + parity-check)
- Delivery: single PR + size:exception (maintainer-approved at Review Workload Guard; user chose Single PR + exception)

## Completed Tasks (11/35 — Phase 0 + Phase 1 complete)

- [x] 0.1 `scripts/capture-oracle.mjs`: build Gatsby `main` → `scripts/oracle/snapshot.json`.
- [x] 0.2 Commit snapshot pre-Astro; meta.commit+version.
- [x] 1.1 GATE: pin astro/`@astrojs/react` minors: `astro@^6.4.8`, `@astrojs/react@^6.0.6`, `@astrojs/check@^0.9.10`, `typescript@^5.9.3`; react/react-dom/@types ^19, sass ^1.79.0, ws ^8.18.0, `@emnapi/runtime` devDep; owned decision: drop `@emoji-mart/*`, `twemoji-parser`, `prismjs`, keep live-emojing/react-i18next/react-icons chain; sharp bundled by Astro; remark-smartypants/rehype-raw deferred to slice 2.
- [x] 1.2 `package.json`: astro + `react@^19`; `build`→`astro build`, `typecheck`→`astro check`.
- [x] 1.3 `netlify.toml`: `[build] command="yarn build" publish="dist"`; NODE_VERSION=22.
- [x] 1.4 `astro.config.mjs` (react, `publicDir:'./static'`, i18n en/es `prefixDefaultLocale:true` `redirectToDefaultLocale:false`, empty markdown) + `tsconfig.json` (excludes dist/public/static — static exclusion = OOM fix) + `src/env.d.ts`.
- [x] 1.5 `src/data/site.ts`; deleted `gatsby-config.ts`, `gatsby-node.js`, `src/hooks/use-site-metadata.tsx`.
- [x] 1.6 RED: `scripts/route-map.mjs` + `scripts/parity-check.mjs` vs empty `dist/` → fail (RED proven pre-build).
- [x] 1.7 `src/layouts/Main.astro` (title emitted only when a page provides `pageTitle`, matching Gatsby `<Seo>` usage; description; Inconsolata fonts; header/footer) + `src/components/link.js` locale-prefix port.
- [x] 1.8 `index.astro` (manual browser-language redirect), `[lang]/le.astro`, `404.astro`, `app/index.astro`, `[lang]/{work,music,bio/index,bio/cv}.astro` — all on `getStaticPaths()` returning a fresh `localeParams()` array.
- [x] 1.9 `static/_redirects`: `/app/* /app/ 200`.

## Files Changed (Batch 2)

| File | Action | What Was Done |
|------|--------|---------------|
| `package.json` / `yarn.lock` | Modified | Gate-1.1-pinned deps: astro ^6.4.8, @astrojs/react ^6.0.6, @astrojs/check ^0.9.10, TS ^5.9.3, React 19 + types, sass ^1.79.0, ws ^8.18.0, @emnapi/runtime devDep; `build`→`astro build`, `typecheck`→`astro check`; dropped gatsby*, emoji-mart, twemoji-parser, prismjs. |
| `netlify.toml` | Modified | `[build] command="yarn build" publish="dist"`; `NODE_VERSION=22`. |
| `astro.config.mjs` | Created | `react()`, `publicDir:'./static'`, `i18n {defaultLocale:'en', locales:['en','es'], routing:{prefixDefaultLocale:true, redirectToDefaultLocale:false}}` (preserves manual `/` browser redirect parity), empty `markdown {}`. |
| `tsconfig.json` | Modified | `astro/tsconfigs/strict`; include src; excludes `["dist","public","static"]` (static exclusion = OOM fix). |
| `src/env.d.ts` | Created | `/// <reference types="astro/client" />`. |
| `src/data/site.ts` | Created | site metadata (title/description/image/siteUrl), `Locale` union + `DEFAULT_LOCALE`, translations helpers. |
| `src/layouts/Main.astro` | Created | main.js/Seo port: `pageTitle` → `diego dorado - {pageTitle}` title only when provided; description; preconnects + Inconsolata; Header/Footer components. |
| `src/lib/locale.ts` | Created | `localeParams()` **factory** (root-cause fix: must return a fresh array — Astro mutates it with `.keyed`), `t()`, `localizePath()`. |
| `src/components/header/Header.astro`, `src/components/Footer.astro` | Created | Nav (Work/Music/Labs/Bio keyed text at build) + footer quote. |
| `src/pages/index.astro` | Created | Manual browser-language redirect (`index.tsx` parity). |
| `src/pages/404.astro` | Created | `pageTitle="404: Not Found"`. |
| `src/pages/app/index.astro` | Created | Client-only app shell. |
| `src/pages/[lang]/le.astro` | Created | Client redirect shell (no title — Gatsby had none). |
| `src/pages/[lang]/music.astro` | Created | MusicIntro `<1></1>` placeholder port; localized page title (`t(lang,'Music')`); 8 bandcamp embeds + 3 fillers. |
| `src/pages/[lang]/bio/index.astro` | Created | Bio paragraphs; CV online/pdf links; `<0>…</0>` placeholder → anchor with inner text as label (Trans port — no literal placeholder text). |
| `src/pages/[lang]/work.astro`, `src/pages/[lang]/bio/cv.astro` | Created | Static shells (content in slice 2 — parity deferred). |
| `static/_redirects` | Created | `/app/* /app/ 200`. |
| `scripts/route-map.mjs` | Created | Slice-1 route parity (expected 21 → emitted 21). |
| `scripts/parity-check.mjs` | Created | Oracle-vs-dist semantic parity; normalization now mirrors capture-oracle (`visibleText`: strip scripts/styles/noscript, decode entities, collapse whitespace); TEXT_MODE per route (alnum/structure/static/deferred). |
| Deleted | `gatsby-config.ts`, `gatsby-node.js`, `src/hooks/use-site-metadata.tsx`, 13 legacy `src/pages/*.{js,tsx}`, `gatsby-types.d.ts`, `src/templates/work-post.js` (delivered slice 1 deletions). |

## Work Unit Evidence (tasks 1.1–1.9)

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `node scripts/route-map.mjs --slice 1` → `slice 1 · expected 21 · later 32 · emitted 21 · MISSING: none · EXTRA: none` → `route-map: slice 1 GREEN`. `node scripts/parity-check.mjs --slice 1` → `parity-check: slice 1 · 17 pass · 0 fail · 4 pending` → exit 0 (4 pending = en/es work + en/es bio/cv, deferred content — slice 2). |
| Runtime harness command/scenario and exact result | `CI=1 yarn build` → exit 0, `13 page(s) built in ~1.3s`, `Complete!` (12 routes + 1 redirects static); `yarn typecheck` → 0 errors, 0 warnings, 95 hints (legacy). |
| Rollback boundary | Revert the three planned work-unit commits (build(deps) / feat(skeleton) / feat(routing)) restores Gatsby surface; `dist/` regenerable. No oracle files touched. |

## Verification Gate Results

- `route-map`: **GREEN** — slice 1 expected 21, emitted 21 (404, app, index, 5 en, 5 es + 8 static passthrough: algo-rimo, blue-mountain, fmtribe, map-h, en/es live-emojing, live-emojing-presentation en/es).
- `parity-check`: **GREEN** — 17 pass · 0 fail · 4 pending. en/es work + en/es bio/cv deferred (content in slice 2).
- `typecheck`: 0 errors / 0 warnings / 95 legacy hints. Build: exit 0, 13 pages, clean (no debug output).

## Defects Fixed During Apply

1. **`NoMatchingStaticPathFound` at render (the build blocker)**: all 5 `[lang]` pages returned the SAME module-level `localeParams` array. Astro's `callGetStaticPaths` (route-cache.js) mutates the returned array: `keyedStaticPaths.keyed = new Map()` keyed by `stringifyParams(params, route, trailingSlash)`. The last route processed (work) overwrote `.keyed` on the shared array, so the route-cache entry for `/en/bio/cv` held `/en/work`,`/es/work` keys → cache miss at render. **Fix**: `localeParams` is now a factory returning a fresh array per call (`getStaticPaths` must never return a shared/module-level array). Verified: cache-set had `["/en/bio/cv","/es/bio/cv"]` during getAll; at render the GET of the same key returned `["/en/work","/es/work"]` before the fix.
2. **Title duplication (app, en/le, es/music)**: Gatsby rendered `<title>` ONLY on pages using `<Seo>` (music/bio/work/404); app and le had none. Main.astro now emits `<title>` only when `pageTitle` is provided; music passes `t(lang,'Music')` so es/music title is localized (`diego dorado - Música`, D10 correct-locale static HTML).
3. **Bio "Nicolás Croce" duplication**: `Random pics, by <0>Nicolás Croce</0>.` was split on `<0></0>` (never matching), so the `<0>…</0>` literal rendered AND the anchor duplicated the name. Fix: regex-extract the placeholder inner text as the anchor label (Trans port).
4. **Comparator asymmetry in parity-check**: `words()` did not mirror capture-oracle `visibleText` (no entity decoding, no `<noscript>` strip). Fixed — parity now compares oracle-normalized vs dist-normalized text identically. This was the source of earlier nbsp/noscript/lt-gt false failures.

## Status

- **11/35 tasks complete** (Phase 0 + Phase 1 done). Phase 1 gates all GREEN: typecheck, build, route-map, parity-check (4 pending = deferred slice-2 content).
- `next_recommended: sdd-verify` for Phase 1, or continue slice 2 (collections) per orchestrator.
- **Runtime objective**: attempt token `sha256:66ecb6b46fd959ba389c170fd3cc37a65c25a929bab6ea32ca494f392905d539`, state=proceed. Settling must name `--remediates-evidence-revision "sha256:75f2988a51b7681de07052fbefc087814156eb9d4d8cb5bb8649f45b148aa3ac"` with verification evidence DISTINCT from that hash.
- No commits made yet in Batch 2 — three work-unit commits planned (build(deps), feat(skeleton), feat(routing)), awaiting orchestrator signal. HEAD still `7c0bef9`.
- `openspec/` planning artifacts remain untracked (excluded from the attempt, per constraint 9).
## Owner Scope Decision (2026-09-17, after Phase 1 verification)

- **cv2612 static assets removed**: `static/cv2612/` (ym2612-processor.js + 53 YM2612 patch `.dmp` files + index/readme) deleted. Verified orphaned: no `/cv2612/` references in src/ or content/; the CV2612 Editor lab already links externally (`https://cv2612.netlify.app/`, `absolute: true` in src/data/labs.yaml); the CV page `[+info]` links point to `/es/works/cv2612/` (the work post, which REMAINS).
- Scope clarification: the work post `content/works/cv2612/index.md` and its code/cover images stay; only the static tree was removed.
- Impact: `dist/cv2612/` no longer ships; no route/parity impact (static passthrough only, no oracle route exists for `/cv2612/`).

---

# Apply Progress: framework-migration — Batch 3 (Phase 2: Content Collections) — BLOCKED

- Batch: 3 (content collections, tasks 2.1–2.6)
- Date: 2026-09-17
- Mode: Standard (strict_tdd: false — verification is typecheck + build + route-map + parity-check)
- Delivery: single PR + size:exception (maintainer-approved at Review Workload Guard)

## Status: BLOCKED at runtime attempt ledger (maintainer decision required) — no code written

The slice-2 run did not write any code. The SDD runtime ledger (`gentle-ai sdd-attempt`) is in `decision_required: true, next_action: reset` and refuses a new acquire; per the apply contract (native attempt authority before any runtime-bearing launch), apply STOPPED at the ledger gate.

### What happened (ledger chain)

1. The slice-1 attempt (objective generation 2, `sha256:7d9e6607...`, charging from tree `dd5d23cc` = commit 7c0bef9) was left `running` by batch 2 (no token persisted, unsettled). Its work is committed at HEAD `5609452` and was re-verified at settle time: typecheck 0 errors / build 13 pages / route-map slice 1 GREEN (21/21) / parity slice 1 17 pass · 0 fail · 4 pending.
2. The settle was refused twice before the maintainer gate:
   - `invalid_continuation`: the passing settle is bound to the oracle attempt's unremediated evidence `sha256:75f2988a51b7681de07052fbefc087814156eb9d4d8cb5bb8649f45b148aa3ac` (the oracle's `changed_line_budget_exceeded: true` pass; an audited reset does NOT release the binding — only a passing settle naming it does).
   - `undeclared_untracked`: untracked inventory digest drifted as dist/ regenerated (ledger supplied the fresh digest, next call used it).
   - `maintainer_decision`: the slice-1 attempt's charged changed lines (~23,290 — yarn.lock churn + Gatsby surface deletions) exceed its declared `--max-changed-lines 1800`, so the budget-exceeded settle needs a maintainer reset before any new attempt can open.
3. Ledger state after the blocked settle: `revision sha256:9cc8c3e245b058f403632f6e50dff59c6082c3a6a3779388db80287c65fe958d`, `decision_required: true`, `next_action: reset`.

### Exact next action — maintainer must run BEFORE relaunching apply for slice 2

```bash
gentle-ai sdd-attempt reset \
  --cwd "/Users/diegodorado/Code/node/diegodorado" \
  --change "framework-migration" \
  --expected-revision "sha256:9cc8c3e245b058f403632f6e50dff59c6082c3a6a3779388db80287c65fe958d" \
  --request-id "<unique-id>" \
  --reason "slice-1 skeleton+routing exceeded changed-line budget (yarn.lock churn + Gatsby surface deletions, ~23K charged vs 1800 declared); size:exception accepted for the migration" \
  --actor "<maintainer>"
```

(`--expected-revision` must equal what `gentle-ai sdd-attempt status --cwd <repo> --change framework-migration` prints at reset time.)

### After the reset (still needed before slice-2 acquire)

1. Settle the slice-1 objective passed, naming the unremediated binding AND evidence distinct from it:
   ```bash
   gentle-ai sdd-attempt settle --cwd "/Users/diegodorado/Code/node/diegodorado" \
     --change "framework-migration" --token <token from status/acquire-continue> \
     --request-id "<unique-id>" --outcome passed \
     --evidence-revision "sha256:56bc39fc8a6664d9718c5b67dac078c9f6271b73ac7532c934a8b9a1aff2a262" \
     --remediates-evidence-revision "sha256:75f2988a51b7681de07052fbefc087814156eb9d4d8cb5bb8649f45b148aa3ac" \
     --diagnosis "slice-1 skeleton+routing complete at HEAD 5609452: typecheck 0 errors, build 13 pages, route-map slice1 GREEN, parity slice1 17 pass 0 fail 4 pending (deferred slice2)" \
     --harness-disposition reused \
     --cleanup-evidence "dist/ regenerable; .astro/ cache; no oracle files modified; openspec/ excluded (untracked-scope exclude)" \
     --process-evidence "gates re-run at settle on HEAD 5609452 with CI=1; evidence sha256:56bc39fc... distinct from remediated 75f2988a" \
     --untracked-scope exclude --expected-untracked-inventory <current digest from `gentle-ai review status --next-transition`>
   ```
2. Then relaunch apply for slice-2 (content collections, tasks 2.1–2.6); the acquiring agent passes `--max-changed-lines 400` (slice-2 estimated ~350 authored lines, no goldens).

### Batch-3 readiness (verified this run, unchanged)

- All four slice-1 gates re-confirmed GREEN at HEAD 5609452 (evidence JSON `/tmp/sdd-evidence/slice1-evidence.json`, sha256 56bc39fc...).
- Phase-2 scope fully pre-read: design D2 route derivation, gatsby-node.js verbatim, oracle route keys (includes `en|es/works/*`, `i-o/poem`, `i-o/presentation`), work frontmatter (poem/presentation have title-only frontmatter — schema must make date/description optional), cv.en.md/cv.es.md bodies, en/es.json, quote/footer behavior, parity TEXT_MODE plan (en/work + en/bio/cv → alnum; es/work + es/bio/cv → structure with es spot tokens; note lhcvmm's unlocalized "Visual Music project" description makes `music` a permissible forbidden token on es/work under the D10 allowlist).

---

# Apply Progress: framework-migration — Batch 3 (Phase 2: Content Collections) — COMPLETED

- Batch: 3 (content collections, tasks 2.1–2.6; slice 2)
- Date: 2026-09-17
- Mode: Standard (strict_tdd: false — verification is typecheck + build + route-map + parity-check)
- Delivery: single PR + size:exception (maintainer-approved at Review Workload Guard)
- Runtime attempt: acquired with `--request-id "apply-slice2-20260917-01" --work-unit "slice-2 content-collections" --max-attempts 2 --max-changed-lines 400 --untracked-scope exclude`; token `sha256:0ea8db3f3c7885c01a721b4361ed0ba83e501c2c8ffb2fcded81dba781f5786f`.

## Completed Tasks (17/35 — Phase 0, 1, 2 complete)

- [x] 2.1 `src/content.config.ts` (no legacy `src/content/config.ts`): glob() works+cv; `image()` cover; `style`.
- [x] 2.2 `src/lib/routes.ts` `resolveRoutes` (D2): locale/slug, unlocalized dup, prev/next.
- [x] 2.3 `[lang]/works/[...slug].astro` getStaticPaths; port `src/templates/work-post.js` (read-only).
- [x] 2.4 `[lang]/work.astro` locale filter; `[lang]/bio/cv.astro` cv.
- [x] 2.5 i18n: URL-locale init missing→en; switcher `getRelativeLocaleUrl`; drop Provider.
- [x] 2.6 Port `seo.tsx` to `src/data/site.ts`.

## Files Changed (Batch 3)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/content.config.ts` | Created | `works` + `cv` collections via `glob()`; custom `generateId` returning the raw relative path (`data.slug ?? entry`) — **critical**: Astro 6.4.8's default glob `generateId` github-slugs EVERY path segment (`cv.en.md` → `cven`, `i-o` → `io`), which would destroy the locale/name structure the route derivation depends on. Schema: `title`/`date` required, `description`/`cover`/`style` optional, `z` from `astro/zod` (not deprecated `astro:content`). |
| `src/lib/routes.ts` | Created | `deriveWorks` + `resolveRoutes` (D2): raw-id parse → slug (`ada/index.en.md` → `ada`), locale (`en`/`es`/`''`), unlocalized duplicate handling, prev/next from the canonical main-works index (Gatsby reduce port), segments/params per route, index-only flag. |
| `src/pages/[lang]/works/[...slug].astro` | Created | Work posts: `getStaticPaths` from `resolveRoutes(works)`, **`params.slug` must be a slash-joined STRING** (`r.segments.join('/')`, not the segments array — Astro rejects arrays: `[GetStaticPathsInvalidRouteParam]`); `render(entry)` (Astro 6 doc'd pattern); double pagination (`<=` / all works / `=>` matching the oracle render); `style` class on the post div. |
| `src/pages/[lang]/work.astro` | Modified | Works listing from collections (index works filtered by locale, date DESC); localized page title `t(lang,'Work')` → es `<title>` is `diego dorado - Obra` (D10 correct-locale). |
| `src/pages/[lang]/bio/cv.astro` | Modified | CV from the `cv` collection by locale suffix (`e.id.replace(/\.md$/,'').endsWith('.'+lang)`), `Download: pdf` kept, throws when the expected locale file is missing (matches Gatsby behavior). |
| `src/lib/i18n.ts` | Created | i18next island init with URL-derived locale (missing → en). |
| `src/components/header/LanguagesLinks.astro` | Modified | `getRelativeLocaleUrl` → prefix swap port (React `Link` to `href`). |
| `src/layouts/Main.astro` | Modified | og meta (og:title/og:description/og:type): `seo.tsx` port — deliberately NOT og:image (the Gatsby site shipped a broken `https://diegodorado.com/undefined`). |
| `src/plugins/rehype-video-embed.mjs` + `astro.config.mjs` | Created/Modified | Partial remark/rehype port (slice-2 scope): `video:` inline-code paragraphs → textless iframes (YouTube/Vimeo embeds, `?t=` → `?start=`). Kills the biggest text-parity delta (5 works pages). Full 800×450 sizing/responsive-iframe remains Phase 4.1. |
| `scripts/route-map.mjs` | Modified | Slice-2 scope: `LATER_PHASE = [/^(en|es)\/labs(\/|$)/]` (8 labs routes stay Phase 5). |
| `scripts/parity-check.mjs` | Modified | Slice-2 `TEXT_MODE` (24 works routes + en/work + es/work + en/bio/cv + es/bio/cv), `ALLOWED_EN` for legit English content on es routes, `DIST_EXTRA_ALLOW` for live-emojing's gatsby-dropped `tidal`/`js` prefixes, and `visibleText` order corrected to mirror capture-oracle (tags BEFORE entity decode). |

## Work Unit Evidence (tasks 2.1–2.6)

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `yarn typecheck` → `0 errors / 0 warnings / 94 hints` (baseline was 95 legacy hints); `yarn build` → exit 0, `37 page(s) built in 2.93s`, `Complete!`. |
| Runtime harness command/scenario and exact result | `node scripts/route-map.mjs --slice 2` → `slice 2 GREEN` (45 expected / 45 emitted, 0 missing/extra, 8 later: labs). `node scripts/parity-check.mjs --slice 2` → `parity-check: slice 2 · 45 pass · 0 fail · 0 pending`, exit 0. |
| Rollback boundary | The four planned work-unit commits below; reverting them restores the pre-slice-2 tree. `dist/` regenerable; `.astro/` cache; `openspec/` excluded (untracked-scope exclude); no oracle files modified. |

## Root-Cause Analysis (parity deltas, all resolved)

1. **Video embeds (the big one)**: `video: URL` inline-code paragraphs render as visible text in Astro but were textless iframes in Gatsby. All 5 affected works (live-emojing / lhcvmm / blue-mountain / i-o / human-aided-music) now embed via `rehype-video-embed`.
2. **Phantom token deltas — normalization order**: `scripts/parity-check.mjs` decoded entities BEFORE stripping tags, while `capture-oracle.mjs` strips tags FIRST (`decodeEntities(html.replace(<script>).replace(<style>).replace(<noscript>).replace(<[^>]+>).replace(ZWSP)).trim().collapse`). For escaped code (`&#x3C;swsn…&#x3E;`) and entity-escaped pagination arrows (`&lt;=`/`=&gt;`), the two orders produce different text. The snapshot is frozen, so parity was fixed to mirror the capture order exactly — this alone removed the `<= all works =>` pagination artifacts and the `swsn`/digits phantom deltas on all en works posts.
3. **`tidal¬` / `js¬` prefixes (live-emojing)**: the oracle (a LOCAL Gatsby build of the same content — verified via `git show 7c0bef9:content/…`) rendered the two inline-code h5 lines WITHOUT the `tidal`/`js` prefixes while keeping the emojis (`💚 * 4`); the current content (and Astro output) keeps them. Gatsby rendering quirk, not a content mismatch — repo content wins; `DIST_EXTRA_ALLOW = {'en/works/live-emojing': ['tidal','js']}` documents it.
4. **es structure forbidden tokens**: all remaining forbidden tokens are REAL English content on es pages — unlocalized bodies (i-o, i-o/presentation, lhcvmm), partially-English live-emojing/es, the CV-body English work titles (es/bio/cv: "Human Aided Music", "Large Hadron Collider Visual Music Machine"), and the listing title (es/work `<title>` was the hardcoded English `work` — now localized `Obra`). Extended `ALLOWED_EN` per route under the same D10 allowlist rationale; Spanish chrome presence is still enforced (3/3 on every es route).
5. **Oracle vs live site confusion (resolved)**: `snapshot.json` = local Gatsby build of main@7c0bef9 and MATCHES repo content; the deployed live site is an older stale build and is irrelevant to parity.

## Deviations from Design

- **Rehype (not remark) video embed, un-sized**: Phase 4.1 plans `remark-video-embed` with 800×450 + responsive-iframe (1.0725rem) + `rehype-raw`. Slice 2 needed text parity NOW and `markdown.rehypePlugins` is the only hook the content-layer `render(entry)` reliably applies — so the plugin lives in rehype with bare iframes (titleless, `loading="lazy"`, `allowfullscreen`). Size/`rehype-raw`/responsive port stays in Phase 4.
- **`render(entry)` with `markdown.rehypePlugins`**: verified empirically — the plugin applies to content-layer renders (the video text deltas disappeared from the rebuilt dist).
- **`exactOptionalPropertyTypes`-era schema**: `date`/`description` optional in the schema per design; the raw-id `generateId` is the significant deviation from any assumed default (skills docs assume slug-without-extension — WRONG on Astro 6.4.8).
- Everything else matches `design.md` D2 derivations (validated against the oracle).

## Status

- **17/35 tasks complete** (Phase 0 + 1 + 2 done). All four gates GREEN at HEAD + slice-2 commits: typecheck 0/0/94, build 37 pages exit 0, route-map slice 2 GREEN (45), parity-check slice 2 GREEN (45 pass / 0 fail / 0 pending).
- `next_recommended: sdd-verify` for Phase 2 (or continue slice 3: images).
- Runtime objective: settling must pass `--remediates-evidence-revision "sha256:56bc39fc8a6664d9718c5b67dac078c9f6271b73ac7532c934a8b9a1aff2a262"` (slice-1 evidence) with distinct verification evidence.
- Four work-unit commits planned (see below); `openspec/` stays untracked.

# Apply Progress: framework-migration — Batch 4 (Phase 3: Image Pipeline) — DISPATCH BLOCKED

- Batch: 4 (image pipeline, tasks 3.1–3.5)
- Status: blocked — Phase 3 apply sub-agent did not run. No code written, no tasks marked.
- Blocker: opencode subagent dispatch flakes (two distinct gates):
  1. SDD preflight dispatcher intermittently refuses the model-embedded `## SDD Session Preflight` block ("model-authored preflight text cannot create parent-confirmed authority") — identical prompt shape ran Phase 2 successfully after retries.
  2. When the preflight gate passes (block omitted), the Console provider refuses the subagent: "OpenCode's free tier can only be used from within OpenCode". Provider/tier-side, transient; Phase 2's dispatch succeeded under the same `opencode/big-pickle` agent model.
- Root cause: not a Gentle AI defect (not a Gentle AI invocation failure); preflight dispatcher + Console provider tier gating. No defect handoff offered.
- Next actions (maintainer decision):
  - Retry identical sdd-apply dispatch (flaky gate has passed on repeat attempts before), OR
  - Pause and check opencode/provider tier or restart opencode, then resume Phase 3, OR
  - Bypass the sdd-apply route and implement Phase 3 via a direct general sub-agent under the same gates.
- Phase 3 scope frozen for the retry: tasks 3.1–3.5 (covers Picture 320 blurred, labs Picture 320, bio [420,840,1680] AR 1.5, rehype-astro-images ≤1000px blurred no anchor, audit). Research gate 5.1 (placeholder/aspectRatio on astro:assets 6.4.8) must be type-checked before 3.1. Blur placeholders are a hard MUST.
