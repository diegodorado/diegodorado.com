// Site metadata source (D1). Replaces gatsby-config siteMetadata +
// src/hooks/use-site-metadata.tsx. Feeding the Main.astro head and
// getStaticPaths locale params.
export const site = {
  langs: ['en', 'es'] as const,
  title: 'diego dorado',
  author: 'Diego Dorado',
  description: "diego dorado's site.",
  siteUrl: 'https://diegodorado.com/',
} as const

export type Locale = (typeof site.langs)[number]