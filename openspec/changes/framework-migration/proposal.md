# Proposal: Framework migration — Gatsby → Astro

## Intent

Gatsby unmaintained; gatsby-plugin-sass on deprecated Dart Sass APIs (breaks Sass 2.0); site is static/content-light/React-heavy. Astro maps closest: collections keep remark surface (no MDX); `Picture` blur matches gatsby-image; islands keep labs/bio. Next.js static export forbids i18n routing; Eleventy rewrites all React. Confirmed: **Astro**.

## Scope

### In Scope
- Skeleton: astro.config, strict TS, `dist/` output
- `/en|/es` + slug + canonical prev/next parity (gatsby-node logic)
- Collections: works/cv, locale-from-filename, frontmatter
- Image + remark parity (video:, ¬/tidal, smartypants, iframe, links)
- i18n + switcher; indented Sass; labs
- netlify.toml build + `dist/` publish

### Out of Scope
- Labs rewrites (live-emojing wss dead) — inventory only
- `static/` leaf sites; rewrite only if simpler

## Capabilities

No existing specs, all new.

### New Capabilities
- `site-routing`: /en|/es parity, slugs, prev/next, `/app/*`, `_redirects`
- `content-collections`: works/cv, frontmatter, locale, i18n resources
- `image-pipeline`: per-consumer Picture: 320 covers, FULL_WIDTH 1.5, profile, labs, markdown 1000
- `remark-rendering`: `video:`, ¬/tidal, smartypants, iframe, external-links
- `labs-islands`: ada, live-emojing, cyclic-fade as islands
- `deployment`: netlify.toml build+publish, `static/` + `_redirects` passthrough

### Modified Capabilities
None.

## Approach

Astro + React islands (`client:visible`). gatsby-node parity via `getStaticPaths`. Remark ports: `video:`; shiki (¬+tidal); smartypants; iframe; external-links. Images: per-consumer `Picture` with blur, widths, webp/avif. i18n: built-in locales + i18next. Deploy: netlify.toml build + `publish=dist`; keep `static/` + `_redirects`.

## Affected Areas

| Area | Impact | Change |
|------|--------|--------|
| `gatsby-config.ts`, `gatsby-node.js` | Removed | astro.config + collections |
| `package.json`, `tsconfig.json`, `netlify.toml` | Modified | Astro deps; strict TS; build+publish |
| `src/pages/*`, `src/templates/work-post.js` | Removed | Astro pages/templates |
| `src/components/*` | Modified | React islands; locale Link |
| `src/plugins/remark-external-links`, `src/styles/*.sass` | Modified | remark port; Vite Sass |
| `static/*` | Unchanged | passthrough incl. `_redirects` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Slug/prev-next drift breaks URLs/SEO | Med | Route-map check vs current output |
| Micro-syntax/image diffs | Med | Per-slice verification; credible equivalence |
| UI build wins → old stack deploys | Med | netlify.toml 1st slice |
| >400-line budget | High | Chained PRs (ask-on-risk) |

## Rollback Plan

Slice-wise, no big-bang: PRs → migration branch; `main` stays Gatsby until done. Revert: revert merge; redeploy green `main` (UI cmd intact).

## Dependencies

- Astro + `@astrojs/react` versions (research)
- Node 22 (set); `sass` retained

## Success Criteria

- [ ] Route map identical to Gatsby
- [ ] Image consumers: widths + blurred placeholders
- [ ] `yarn build` green; Netlify deploys from repo config
- [ ] Remark behaviors verified on sampled posts
- [ ] Working labs render as islands