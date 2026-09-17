// Content layer (D1): legacy src/content/config.ts was removed in Astro v6 —
// collections live in this file with glob() loaders.
//   works: content/works/<slug>/{index,index.{en,es},poem.{en,es},presentation}.md
//   cv:    content/cv/cv.{en,es}.md
// Locale derives from the filename suffix (suffix-less = locale-agnostic,
// available at both /en and /es) — see src/lib/routes.ts for the D2 port.
// NOTE: the v6 glob loader's default generateId github-slugs each path segment
// ('index.en' -> 'indexen', 'i-o' -> 'io'), which destroys the name/locale
// structure the D2 derivation relies on — ids must be the raw relative path.
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// Raw relative path as id (e.g. 'ada/index.en.md'): mirrors Astro's legacy
// id behavior — preserves the filename (locale suffix, index flag) verbatim
// for gatsby-node.js onCreateNode parity.
const rawId = ({ entry, data }: { entry: string; data: { slug?: string } }) =>
  data.slug ?? entry

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/works', generateId: rawId }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // i-o/poem.* and i-o/presentation carry title-only frontmatter, so date
      // and description MUST stay optional. Gatsby parsed date strings into
      // Date objects; coerce keeps that behavior.
      date: z.coerce.date().optional(),
      description: z.string().optional(),
      cover: image().optional(),
      style: z.string().optional(), // cv2612: dashed
    }),
})

const cv = defineCollection({
  loader: glob({ pattern: 'cv.{en,es}.md', base: './content/cv', generateId: rawId }),
  schema: z.object({}),
})

export const collections = { works, cv }