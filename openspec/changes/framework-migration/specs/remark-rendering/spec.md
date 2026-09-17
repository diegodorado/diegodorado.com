# Remark Rendering Specification

## Purpose

Ports the current remark chain so markdown renders equivalently: `video:` embeds, `¬` inline code, tidal syntax alias, smartypants, responsive iframes, external-link decoration, and relative media copying.

## Requirements

### Requirement: Video Embed Shorthand

The system MUST render inline-code `video: <url>` as an embedded video 800px wide with a 16:9 aspect ratio.

#### Scenario: Video embed

- GIVEN a post containing `video: https://example.com/talk.mp4`
- WHEN the post renders
- THEN a video embed at 800px width and 16:9 aspect ratio appears

#### Scenario: Missing URL

- GIVEN inline code `video:` with no URL
- WHEN the post renders
- THEN the text remains unchanged inline code

### Requirement: Inline Code Marker

The system MUST treat the `¬` character as the inline-code marker for syntax highlighting.

#### Scenario: Marked inline code

- GIVEN ```¬fromButton``` in a post
- WHEN highlighted
- THEN the inline snippet renders with code styling

### Requirement: Tidal Syntax Alias

The system MUST highlight `tidal` language blocks using the Haskell grammar.

#### Scenario: Tidal block

- GIVEN a code block tagged `tidal`
- WHEN rendered
- THEN highlighting follows the Haskell grammar

### Requirement: Smartypants

The system MUST apply typographic punctuation to rendered prose.

#### Scenario: Straight quotes

- GIVEN a post with straight quotes and double hyphens
- WHEN rendered
- THEN output uses curly quotes and proper dashes

### Requirement: Responsive Iframes

The system MUST wrap iframes in a responsive container that preserves their aspect ratio.

#### Scenario: Markdown iframe

- GIVEN an iframe inside a work post
- WHEN rendered
- THEN it is wrapped in an aspect-ratio container and does not overflow on mobile viewports

### Requirement: External Link Decoration

The system MUST add `target` and `rel` security attributes to http(s) external links and MUST leave internal links untouched.

#### Scenario: External link

- GIVEN a link to `https://example.com`
- WHEN rendered
- THEN the anchor has `target="_blank"` and rel `noopener`/`noreferrer`

#### Scenario: Internal link

- GIVEN a link to `/es/works/x`
- WHEN rendered
- THEN no target or rel attributes are added

### Requirement: Linked Media Copying

The system MUST copy relative references to PDF, mp4, and webm files into the build output and rewrite the references.

#### Scenario: Relative video

- GIVEN a post linking `../assets/clip.mp4`
- WHEN the site builds
- THEN the file is emitted into the output and the reference is rewritten to the built path

#### Scenario: Missing asset

- GIVEN a relative reference to a file that does not exist
- WHEN the site builds
- THEN the build fails with a clear error instead of emitting a dead link