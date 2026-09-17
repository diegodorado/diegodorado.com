# Site Routing Specification

## Purpose

Routes the site with parity to the current Gatsby output: every page is available under both `/en/` and `/es/` prefixes, works posts keep identical slugs, and prev/next navigation follows the same canonical index.

## Requirements

### Requirement: Locale Prefix Parity

The system MUST serve every static page at both `/en/<path>` and `/es/<path>` with identical structure and content.

#### Scenario: Localized content duplicated

- GIVEN a static page rendered at `/work`
- WHEN the site is built
- THEN `/en/work` and `/es/work` both return the same page content

#### Scenario: Locale-agnostic assets

- GIVEN a route without localizable content
- WHEN it is built
- THEN the page exists under both prefixes with identical markup

### Requirement: Works Slugs and Locale Derivation

The system MUST derive a work's locale from its filename suffix `name.lang.md` and generate `/en|/es/works/{slug}` routes. Unlocalized works MUST be duplicated to both locales.

#### Scenario: Localized work

- GIVEN `content/works/mi-obra.es.md`
- WHEN the site is built
- THEN `/es/works/mi-obra` is generated with slug `mi-obra`, locale suffix stripped

#### Scenario: Unlocalized work

- GIVEN `content/works/my-work.md`
- WHEN the site is built
- THEN `/en/works/my-work` and `/es/works/my-work` both exist

### Requirement: Canonical Prev/Next Index

The system MUST compute previous/next links from an index of main works whose canonical entry is the `es` version or the unlocalized file. Localized non-canonical variants MUST NOT add index items, and both locale variants of a work MUST share the same prev/next result.

#### Scenario: Canonical ordering

- GIVEN three canonical works A, B, C in index order
- WHEN viewing B at `/es/works/b`
- THEN prev links to A and next links to C

#### Scenario: Localized pair counted once

- GIVEN a work with a localized `es` entry and an unlocalized entry
- WHEN comparing prev/next on `/en/works/x` and `/es/works/x`
- THEN both variants show the same prev/next neighbors

### Requirement: App Client-Only Routes

The system MUST serve every `/app/*` path with client-side routing, without a server-rendered source file for each path.

#### Scenario: Direct navigation

- GIVEN a request to `/app/todo`
- WHEN the URL is loaded
- THEN the app shell renders client-side

### Requirement: Redirects

The system MUST client-redirect root `/` to `/{lang}/work`, and MUST apply the rules in `static/_redirects`.

#### Scenario: Root redirect

- GIVEN a visit to `/`
- WHEN the page loads
- THEN the client is redirected to `/{lang}/work`

#### Scenario: Redirects file rule

- GIVEN a production request to `/es/labs/bingo`
- WHEN the edge serves it
- THEN the `_redirects` rule forwards it to `/bingo`

### Requirement: Language Switcher Prefix Swap

The system MUST swap the locale prefix of the current route when the visitor switches language, preserving the remaining path.

#### Scenario: Switch on a works post

- GIVEN the visitor is on `/es/works/mi-obra`
- WHEN they switch to English
- THEN the URL becomes `/en/works/mi-obra`