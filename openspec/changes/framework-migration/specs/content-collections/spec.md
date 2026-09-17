# Content Collections Specification

## Purpose

Exposes works and CV content as typed collections with validated frontmatter, locale derived from filenames, and i18n resources for keyed UI copy.

## Requirements

### Requirement: Works and CV Collections

The system MUST expose `content/works/**/*.md` and `content/cv/cv.{en,es}.md` as typed collections with strict TypeScript schemas.

#### Scenario: Works query

- GIVEN a built collection
- WHEN a page queries works entries
- THEN every entry exposes typed frontmatter fields (cover, date, description, slug, locale)

#### Scenario: CV localized entries

- GIVEN the collection is queried for CV
- THEN both `cv.en.md` and `cv.es.md` resolve, each with its locale field set

### Requirement: Frontmatter Validation

The system MUST validate frontmatter against the collection schema and MUST support a custom optional `style` field.

#### Scenario: Valid entry

- GIVEN a work with complete frontmatter
- WHEN the build type-checks
- THEN the entry is accepted and rendered

### Requirement: Locale from Filename

The system MUST derive `locale` from the `name.lang.md` suffix and MUST treat suffix-less files as locale-agnostic, available to both `/en` and `/es` routes.

#### Scenario: Suffixed file

- GIVEN `content/works/x.es.md` is ingested
- THEN the entry exposes locale `es`

#### Scenario: Suffix-less file

- GIVEN `content/works/y.md` is ingested
- THEN the entry carries no locale binding and is available to both locale prefixes

### Requirement: i18n Resources

The system MUST load `src/translations/{en,es}.json` as the source of keyed UI copy and MUST resolve copy against the active locale.

#### Scenario: Active locale copy

- GIVEN the active locale is `es`
- WHEN the header renders
- THEN keyed strings come from the Spanish resource

#### Scenario: Missing key

- GIVEN a key absent from the active locale resource
- WHEN the string resolves
- THEN the system falls back to the English value

### Requirement: Site Metadata Source

The system MUST provide global metadata (title, description, author) from a single typed source consumed by every page and the SEO component.

#### Scenario: SEO consumption

- GIVEN a page rendering the SEO component
- THEN meta tags reflect the configured global metadata

#### Scenario: Single source

- GIVEN metadata is changed in the source
- WHEN the site rebuilds
- THEN every page reflects the change without per-page overrides
