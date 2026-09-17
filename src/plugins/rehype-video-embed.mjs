/**
 * rehype-video-embed.mjs — partial remark/rehype port (slice 2).
 *
 * Gatsby's old remark pipeline turned a standalone inline-code paragraph of
 * the form
 *
 *     `video: https://youtu.be/…`
 *
 * into an embedded player (iframe). Astro's markdown pipeline renders it as
 * visible text, which breaks text parity with the oracle snapshot and loses
 * the embed. This plugin mirrors the Gatsby behavior: a paragraph whose only
 * child is `code` starting with `video:` becomes a textless iframe.
 *
 * The full remark-render parity (fenced-code spans, smart quotes, heading
 * anchors) is tracked in the imagery/remark slice (Phase 4).
 */

const YOUTUBE_RE = /(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/
const VIMEO_RE = /vimeo\.com\/(\d+)/

/** Parse `29m57s` / `90s` / `123` / `2h3m5s`-style start markers into seconds. */
function startSeconds(url) {
  const t = url.match(/[?&#]t=(\d+h)?(\d+m)?(\d+s?)?/)
  if (!t) return null
  const h = t[1] ? parseInt(t[1], 10) : 0
  const m = t[2] ? parseInt(t[2], 10) : 0
  const s = t[3] ? parseInt(t[3], 10) : 0
  const total = h * 3600 + m * 60 + s
  return total > 0 ? total : null
}

/** Audio/video → textless embed, matching the oracle's player-only render. */
function embedProperties(url) {
  const youTube = url.match(YOUTUBE_RE)
  if (youTube) {
    const base = `https://www.youtube.com/embed/${youTube[1]}`
    const start = startSeconds(url)
    return {
      src: start ? `${base}?start=${start}` : base,
      title: '',
      allow: 'fullscreen',
      loading: 'lazy',
      allowFullscreen: true,
      frameBorder: 0,
    }
  }
  const vimeo = url.match(VIMEO_RE)
  if (vimeo) {
    return {
      src: `https://player.vimeo.com/video/${vimeo[1]}`,
      title: '',
      allow: 'fullscreen',
      loading: 'lazy',
      allowFullscreen: true,
      frameBorder: 0,
    }
  }
  return { src: url, title: '' }
}

export default function rehypeVideoEmbed() {
  return (tree) => {
    for (const node of tree.children ?? []) {
      if (node.type !== 'element' || node.tagName !== 'p') continue
      const [child] = node.children ?? []
      if (!child || child.type !== 'element' || child.tagName !== 'code') continue
      const [text] = child.children ?? []
      if (!text || text.type !== 'text') continue
      const value = text.value
      if (!/^video\s*:\s*https?:\/\//i.test(value)) continue
      const url = value.replace(/^video\s*:\s*/i, '').trim()
      node.tagName = 'iframe'
      node.properties = embedProperties(url)
      node.children = []
    }
  }
}