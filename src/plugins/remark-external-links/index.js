// Inline replacement for gatsby-remark-external-links.
// Adds target and rel attributes to external http(s) links in markdown.
// unist-util-visit@4 is ESM-only, so it is loaded dynamically from this
// CommonJS module. gatsby-transformer-remark awaits plugin calls, so the
// async transformer is fully supported.

module.exports = async ({ markdownAST }, options = {}) => {
  const { visit } = await import('unist-util-visit')
  const target = options.target === undefined ? '_blank' : options.target
  const rel = options.rel === undefined ? 'nofollow noopener' : options.rel

  const decorate = (node, url) => {
    if (/^https?:\/\//.test(url)) {
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      if (target !== null) node.data.hProperties.target = target
      if (rel !== null) node.data.hProperties.rel = rel
    }
  }

  visit(markdownAST, 'link', (node) => decorate(node, node.url))

  // Reference-style links ([text][ref]) resolve their URL from a definition.
  visit(markdownAST, 'linkReference', (node) => {
    let definition = null
    visit(markdownAST, 'definition', (def) => {
      if (!definition && def.identifier === node.identifier) definition = def
    })
    if (definition && definition.url) decorate(node, definition.url)
  })
}