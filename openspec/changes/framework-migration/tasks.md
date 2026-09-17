# Tasks: Framework Migration (Gatsby → Astro)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Changed lines | ~1,600–2,000 |
| 400-line risk | High |
| Chained PRs | Yes |
| Split | PR 0–5 slices |
| Delivery | ask-on-risk |
| Chain | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: single-pr + size:exception (maintainer-approved; user chose Single PR + exception at the Review Workload Guard)
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Test command | Harness | Rollback |
|------|------|----|--------------|---------|----------|
| 1 | Oracle snapshot | PR 0 | yarn build + capture-oracle | parity-check RED pre-Astro | Revert; regenerable |
| 2 | Skeleton+routing ~350 | PR 1 | typecheck+build; route-map | Netlify preview via netlify.toml | Revert deps/netlify |
| 3 | Collections ~300 | PR 2 | typecheck+build; route-map | local dist walk | Revert collections |
| 4 | Images ~250 | PR 3 | typecheck+build; avif grep | parity-check images | Revert Pictures |
| 5 | Remark+styles ~300 | PR 4 | typecheck+build; goldens | parity-check works | Revert plugins |
| 6 | Labs+gate ~250 | PR 5 | typecheck+build; full parity | full dist diff | Revert merge |

## Phase 0: Oracle

- [x] 0.1 `scripts/capture-oracle.mjs`: build Gatsby `main` → `scripts/oracle/snapshot.json`.
- [x] 0.2 Commit snapshot pre-Astro; meta.commit+version.

## Phase 1: Skeleton + Routing

- [x] 1.1 GATE: pin astro/`@astrojs/react` minors from `openspec/changes/framework-migration/research.md` (read-only).
- [x] 1.2 `package.json`: astro + `react@^19`; `build`→`astro build`, `typecheck`→`astro check`.
- [x] 1.3 `netlify.toml`: `[build] command="yarn build" publish="dist"`; NODE_VERSION=22.
- [x] 1.4 `astro.config.mjs`+`tsconfig.json`+`src/env.d.ts`: react, publicDir→static, i18n en/es, markdown, sass.
- [x] 1.5 `src/data/site.ts`; delete `gatsby-config.ts`, `gatsby-node.js`, `src/hooks/use-site-metadata.tsx`.
- [x] 1.6 RED: `scripts/route-map.mjs`+`scripts/parity-check.mjs` vs empty `dist/` → fail.
- [x] 1.7 `src/layouts/Main.astro` + `src/components/link.js` locale-prefix port.
- [x] 1.8 `index.astro`, `[lang]/le.astro`, `404.astro`, `app/index.astro`, `[lang]/{work,music,bio/index,bio/cv}.astro`.
- [x] 1.9 `static/_redirects`: `/app/* /app/ 200`.

## Phase 2: Content Collections

- [x] 2.1 `src/content.config.ts` (no legacy `src/content/config.ts`): glob() works+cv; `image()` cover; `style`.
- [x] 2.2 `src/lib/routes.ts` `resolveRoutes` (D2): locale/slug, unlocalized dup, prev/next.
- [x] 2.3 `[lang]/works/[...slug].astro` getStaticPaths; port `src/templates/work-post.js` (read-only).
- [x] 2.4 `[lang]/work.astro` locale filter; `[lang]/bio/cv.astro` cv.
- [x] 2.5 i18n: URL-locale init missing→en; switcher `getRelativeLocaleUrl`; drop Provider.
- [x] 2.6 Port `seo.tsx` to `src/data/site.ts`.

## Phase 3: Images

- [ ] 3.1 Covers `Picture` 320 avif/webp blurred (work list+post).
- [ ] 3.2 Labs glob `../data/labs/*.{png,jpg}` → Picture 320.
- [ ] 3.3 Bio/profile glob `content/assets/pics/*` → Picture [420,840,1680] AR 1.5.
- [ ] 3.4 `rehype-astro-images`: getImage → ≤1000px blurred, no anchor.
- [ ] 3.5 Audit: grep avif/webp+blurred; no md-image anchor.

## Phase 4: Remark/Rehype + Styles

- [ ] 4.1 `remark-video-embed`: `video:` inline-code → 800×450 iframe; URL missing unchanged.
- [ ] 4.2 external-links port: target blank + rel nofollow noopener; internal untouched.
- [ ] 4.3 responsive-iframe port (1.0725rem); add `rehype-raw`.
- [ ] 4.4 Shiki tidal→haskell, one-dark-pro, strip `¬`; drop prismjs.
- [ ] 4.5 copy-linked-files port: pdf/mp4/webm → hashed copy; missing → build error.
- [ ] 4.6 Add `remark-smartypants`.
- [ ] 4.7 Wire `.sass` indented via Vite; keep theming.
- [ ] 4.8 Goldens: live-emojing, cv2612, i-o, visuals, live-coding.

## Phase 5: Labs + Verify

- [ ] 5.1 GATE: react-i18next/emoji-mart/react/react-icons accept React 19 (`research.md` (read-only)).
- [ ] 5.2 Islands client:visible `[lang]/labs/{ada,live-emojing,live-emojing-midi}.astro`; dead wss → shell+feedback.
- [ ] 5.3 Hydrate cyclic-fade bio island (Phase-3 pics).
- [ ] 5.4 Delete Gatsby: `src/pages/*.js`, `src/templates/*`, `src/layouts/main.js`, `src/plugins/remark-external-links/`, `src/hooks/`.
- [ ] 5.5 Full parity gate + deploy audit.