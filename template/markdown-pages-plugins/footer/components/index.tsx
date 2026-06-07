type FooterOptions = {
  siteTitle?: string
  showAttribution?: boolean
  attributionText?: string
  attributionUrl?: string
}

export const Footer = (opts?: FooterOptions) => {
  const siteTitle = opts?.siteTitle?.trim() || "Markdown Pages"
  const attributionText = opts?.attributionText?.trim() || "Built with Markdown Pages"
  const attributionUrl = opts?.attributionUrl?.trim() || "https://www.npmjs.com/package/@codemeall/create-markdown-pages"
  const showAttribution = opts?.showAttribution !== false

  function MarkdownPagesFooter({ displayClass }: { displayClass?: string }) {
    return (
      <footer class={`markdown-pages-footer ${displayClass ?? ""}`}>
        <p>
          <span>{siteTitle}</span>
          {showAttribution && (
            <>
              <span aria-hidden="true">/</span>
              <a href={attributionUrl}>{attributionText}</a>
            </>
          )}
        </p>
      </footer>
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
