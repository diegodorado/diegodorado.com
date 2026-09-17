# Image Pipeline Specification

## Purpose

Reproduces the current sharp/gatsby-image behavior per consumer: fixed 320 covers and labs images, full-width gallery and profile, and max-width-1000 in-markdown images — all with webp/avif variants and blurred placeholders.

## Requirements

### Requirement: Fixed 320 Covers

The system MUST render work `cover` frontmatter images and labs YAML-referenced images as fixed 320x320 images with responsive srcsets and a blurred placeholder.

#### Scenario: Work cover

- GIVEN a work with `cover: "./cover.jpg"`
- WHEN the work page renders
- THEN the image is fixed at 320x320 with webp/avif variants

#### Scenario: Labs image

- GIVEN a labs entry referencing an image under `src/data/labs/`
- WHEN the labs grid renders
- THEN the image is fixed at 320 with a blurred placeholder

### Requirement: Full-Width Pics Gallery

The system MUST render every `content/assets/pics/*.jpg` as a full-width image with aspect ratio 1.5, responsive srcsets, and a blurred placeholder.

#### Scenario: Gallery image

- GIVEN the bio pics query returns 17 images
- WHEN the gallery island renders
- THEN each image is full-width, keeps a 1.5 aspect ratio, and shows a blurred placeholder while loading

### Requirement: Full-Width Profile

The system MUST render `profile.jpg` full-width with a blurred placeholder.

#### Scenario: Profile render

- GIVEN the bio section renders
- WHEN `profile.jpg` loads
- THEN it is full-width with responsive variants and a blur-up placeholder

### Requirement: In-Markdown Images

The system MUST render images referenced inside work markdown at a maximum width of 1000px, with responsive variants and a blurred placeholder, and MUST NOT link them to the original file.

#### Scenario: Markdown image

- GIVEN a work post embedding an image
- WHEN the post renders
- THEN the image caps at 1000px width and the markup contains no link to the original

### Requirement: Formats and Placeholders Default

All pipeline-generated images MUST include webp and avif srcset variants and a blurred placeholder by default.

#### Scenario: Format audit

- GIVEN a built page containing any pipeline image
- WHEN the markup is inspected
- THEN the srcset contains webp and avif candidates

#### Scenario: Blur placeholder

- GIVEN any pipeline image while loading
- WHEN the placeholder displays
- THEN a blurred low-resolution version renders before the full-resolution image