# Deployment Specification

## Purpose

Defines Netlify deployment from repository configuration: the build command and publish directory MUST live in `netlify.toml`, `static/` passes through unchanged, and the build runs on Node 22.

## Requirements

### Requirement: Build Command Repatriation

The system MUST define the build command and publish directory in `netlify.toml`; deployment MUST NOT depend on settings in the Netlify UI.

#### Scenario: Fresh clone deploy

- GIVEN a fresh clone with no UI-configured build command
- WHEN Netlify builds the site
- THEN it runs the repository-defined build command

#### Scenario: UI drift guard

- GIVEN the Netlify UI build command is cleared
- WHEN the site is rebuilt
- THEN the build still succeeds from `netlify.toml` alone

### Requirement: Publish Directory

The system MUST publish the `dist/` output directory.

#### Scenario: Static output

- GIVEN `yarn build` completes
- WHEN Netlify publishes
- THEN the deployed site serves `dist/`

### Requirement: Static Passthrough

The system MUST copy `static/*` into the publish output unchanged, including `_redirects`.

#### Scenario: Leaf sites

- GIVEN static leaf sites under `static/` (e.g., algo-rimo)
- WHEN deployed
- THEN the files appear in the published site at their original paths

#### Scenario: Redirects file

- GIVEN `static/_redirects`
- WHEN published
- THEN the file exists in `dist/` and its rules are enforced in production

### Requirement: Node Version

The system MUST build on Node 22 as declared in `netlify.toml`.

#### Scenario: Build runtime

- GIVEN Netlify runs the build
- WHEN the environment is inspected
- THEN Node 22 is active

### Requirement: Migration Sequencing

Until the final slice lands, `main` MUST remain on the Gatsby stack. The `netlify.toml` build/publish change MUST land before or with the first Astro slice so no subsequent slice silently deploys the old stack.

#### Scenario: Slice order

- GIVEN the first Astro slice is merged to the migration branch
- THEN `netlify.toml` already builds and publishes the new stack

#### Scenario: Rollback

- GIVEN a failing migrated deploy
- WHEN the merge is reverted
- THEN `main` redeploys the last green Gatsby build without UI changes