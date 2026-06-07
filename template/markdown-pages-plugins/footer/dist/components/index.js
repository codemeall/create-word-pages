import path from "node:path"
import { pathToFileURL } from "node:url"

const preactModule = await import(
  pathToFileURL(path.join(process.cwd(), "node_modules", "preact", "dist", "preact.mjs")).href
)
const { Fragment, h } = preactModule

export const Footer = (opts = {}) => {
  const siteTitle = opts.siteTitle?.trim() || "Markdown Pages"
  const attributionText = opts.attributionText?.trim() || "Built with Markdown Pages"
  const attributionUrl = opts.attributionUrl?.trim() || "https://www.npmjs.com/package/@codemeall/create-markdown-pages"
  const showAttribution = opts.showAttribution !== false

  function MarkdownPagesFooter({ displayClass }) {
    return h(
      "footer",
      { class: `markdown-pages-footer ${displayClass ?? ""}` },
      h(
        "p",
        null,
        h("span", null, siteTitle),
        showAttribution &&
          h(
            Fragment,
            null,
            h("span", { "aria-hidden": "true" }, "/"),
            h("a", { href: attributionUrl }, attributionText),
          ),
      ),
    )
  }

  MarkdownPagesFooter.css = `
.markdown-pages-footer {
  grid-area: grid-footer;
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 4rem 0 2rem;
  padding: 1.5rem 0 0;
}

.markdown-pages-footer p {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
}

.markdown-pages-footer a {
  color: var(--secondary);
}
`

  return MarkdownPagesFooter
}
