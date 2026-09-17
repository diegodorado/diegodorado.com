# Labs Islands Specification

## Purpose

Renders labs features and bio animations as scoped React islands, preserving existing components while removing whole-page React hydration. Known-broken labs are inventory-only and must not block the migration.

## Requirements

### Requirement: Scoped React Islands

The system MUST render interactive labs and bio features as React islands hydrated only when visible, with no whole-page React hydration.

#### Scenario: Island hydration

- GIVEN a labs page containing a React island
- WHEN the island scrolls into view
- THEN it hydrates and becomes interactive

#### Scenario: No page-wide hydration

- GIVEN a page section with no interactive behavior
- WHEN the page loads
- THEN no React runtime is loaded for that section

### Requirement: Ada Canvas Island

The system MUST render `/labs/ada` as a self-contained canvas island with no external dependencies.

#### Scenario: Ada works

- GIVEN a visit to `/labs/ada`
- WHEN the page loads
- THEN the canvas animates without network calls

### Requirement: Live-Emojing Non-Blocking

The system MUST render live-emojing and live-emojing-midi as islands. Their external WebSocket backend MAY be unavailable, and that MUST NOT break the build or other pages.

#### Scenario: Dead backend

- GIVEN the `wss://av.thundernize.com/websocket` backend is unreachable
- WHEN the island hydrates
- THEN the shell renders with connection feedback and the rest of the site is unaffected

#### Scenario: Build isolation

- GIVEN live-emojing in its current partly-broken state
- WHEN `yarn build` runs
- THEN the build succeeds; labs defects are inventoried, not fixed, in this change

### Requirement: Cyclic Fade Bio Animation

The system MUST drive the bio pics gallery with the existing cyclic-fade React animation fed by the full-width images.

#### Scenario: Gallery animation

- GIVEN the bio section with 17 pics
- WHEN the island is visible
- THEN images cycle through the fade animation with blurred placeholders