import React, { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { validateWordPagesConfig } from "./configValidation.js"
import "./styles.css"

type SaveState = "idle" | "dirty" | "saving" | "saved" | "failed"

type WordPagesConfig = {
  site: {
    title: string
    description: string
    author: string
    githubUsername: string
    repositoryName: string
    visibility: "ask" | "public" | "private"
    baseUrl: string
  }
  theme: {
    preset: string
  }
  branding: {
    showAttribution: boolean
    attributionText: string
    attributionUrl: string
  }
  content: {
    source: string
    staged: string
  }
}

type SiteFieldErrors = Partial<Record<keyof WordPagesConfig["site"], string>>

function deriveBaseUrl(username: string, repositoryName: string) {
  if (!username || !repositoryName) return ""
  if (repositoryName.toLowerCase() === `${username.toLowerCase()}.github.io`) return `${username}.github.io`
  return `${username}.github.io/${repositoryName}`
}

function displayPagesUrl(baseUrl: string) {
  return baseUrl ? `https://${baseUrl}/` : "Configure GitHub details to preview the Pages URL."
}

function normalizeConfig(data: WordPagesConfig): WordPagesConfig {
  return {
    ...data,
    branding: {
      showAttribution: data.branding?.showAttribution !== false,
      attributionText: data.branding?.attributionText ?? "Built with Markdown Pages",
      attributionUrl: data.branding?.attributionUrl ?? "https://www.npmjs.com/package/@codemeall/create-markdown-pages"
    }
  }
}

function App() {
  const [config, setConfig] = useState<WordPagesConfig | null>(null)
  const [status, setStatus] = useState("Loading")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [message, setMessage] = useState("Load the wizard, edit settings, then save.")
  const [lastSavedAt, setLastSavedAt] = useState("")

  useEffect(() => {
    fetch("/api/config")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load markdown-pages.config.json")
        return response.json()
      })
      .then((data) => {
        setConfig(normalizeConfig(data))
        setStatus("Ready")
        setMessage("Configuration loaded from markdown-pages.config.json.")
      })
      .catch((error) => {
        setStatus("Could not load configuration")
        setSaveState("failed")
        setMessage(error instanceof Error ? error.message : "Restart npm run wizard from the site root.")
      })
  }, [])

  const pageUrl = useMemo(() => {
    if (!config?.site.githubUsername || !config.site.repositoryName) return "Configure GitHub details to preview the Pages URL."
    return displayPagesUrl(deriveBaseUrl(config.site.githubUsername, config.site.repositoryName))
  }, [config])

  const fieldErrors = useMemo<SiteFieldErrors>(() => {
    if (!config) return {}
    return validateWordPagesConfig(config).fieldErrors
  }, [config])
  const canSave = Object.keys(fieldErrors).length === 0 && saveState !== "saving"

  if (!config) {
    return (
      <main className="shell">
        <section className={`status-panel ${saveState}`} role="status" aria-live="polite">
          <div>
            <strong>{status}</strong>
            <p>{message}</p>
          </div>
        </section>
      </main>
    )
  }

  function updateSite<K extends keyof WordPagesConfig["site"]>(key: K, value: WordPagesConfig["site"][K]) {
    setConfig((current) => current && {
      ...current,
      site: {
        ...current.site,
        [key]: value,
        baseUrl: key === "githubUsername" || key === "repositoryName"
          ? deriveBaseUrl(
            key === "githubUsername" ? String(value) : current.site.githubUsername,
            key === "repositoryName" ? String(value) : current.site.repositoryName
          )
          : current.site.baseUrl
      }
    })
    setSaveState("dirty")
    setMessage("Unsaved changes. Click Save changes to write markdown-pages.config.json.")
  }

  function updateBranding<K extends keyof WordPagesConfig["branding"]>(key: K, value: WordPagesConfig["branding"][K]) {
    setConfig((current) => current && {
      ...current,
      branding: {
        ...current.branding,
        [key]: value
      }
    })
    setSaveState("dirty")
    setMessage("Unsaved changes. Click Save changes to write markdown-pages.config.json.")
  }

  async function save() {
    const validation = validateWordPagesConfig(config)
    if (!validation.ok) {
      setStatus("Required fields missing")
      setSaveState("failed")
      setMessage("Complete the required fields before saving markdown-pages.config.json.")
      return
    }

    try {
      setStatus("Saving")
      setSaveState("saving")
      setMessage("Saving markdown-pages.config.json...")

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      })
      const result = await response.json().catch(() => ({ message: "No response body" }))
      if (!response.ok || result.ok === false) {
        if (result.fieldErrors) {
          throw new Error(result.message ?? "Complete the required fields before saving.")
        }
        throw new Error(result.message ?? "Save failed")
      }

      const savedAt = new Date().toLocaleTimeString()
      setStatus("Saved")
      setSaveState("saved")
      setLastSavedAt(savedAt)
      setMessage(`Saved to markdown-pages.config.json at ${savedAt}. Keep npm run preview open in another terminal to refresh the local site.`)
    } catch (error) {
      setStatus("Save failed")
      setSaveState("failed")
      setMessage(error instanceof Error ? error.message : "Save failed")
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Markdown Pages setup</p>
          <h1>Configure your Obsidian-powered site.</h1>
          <p className="lede">This wizard writes local configuration only. It does not ask for GitHub credentials and does not upload your vault.</p>
        </div>
        <button type="button" onClick={save} disabled={!canSave}>
          {saveState === "saving" ? "Saving..." : "Save changes"}
        </button>
      </section>

      <section className={`status-panel ${saveState}`} role="status" aria-live="polite">
        <div>
          <strong>{status}</strong>
          <p>{message}</p>
        </div>
        {lastSavedAt && <span>Last saved {lastSavedAt}</span>}
      </section>

      <section className="grid">
        <label>
          Site title
          <input value={config.site.title} onChange={(event) => updateSite("title", event.target.value)} aria-invalid={Boolean(fieldErrors.title)} />
          {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
        </label>
        <label>
          Author or organization
          <input value={config.site.author} onChange={(event) => updateSite("author", event.target.value)} />
        </label>
        <label className="wide">
          Description
          <textarea value={config.site.description} onChange={(event) => updateSite("description", event.target.value)} />
        </label>
        <label>
          GitHub username
          <input value={config.site.githubUsername} onChange={(event) => updateSite("githubUsername", event.target.value)} aria-invalid={Boolean(fieldErrors.githubUsername)} />
          {fieldErrors.githubUsername && <span className="field-error">{fieldErrors.githubUsername}</span>}
        </label>
        <label>
          Repository name
          <input value={config.site.repositoryName} onChange={(event) => updateSite("repositoryName", event.target.value)} aria-invalid={Boolean(fieldErrors.repositoryName)} />
          {fieldErrors.repositoryName && <span className="field-error">{fieldErrors.repositoryName}</span>}
        </label>
        <label>
          Repository visibility
          <select value={config.site.visibility} onChange={(event) => updateSite("visibility", event.target.value as WordPagesConfig["site"]["visibility"])}>
            <option value="ask">Decide before publishing</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label>
          GitHub Pages base URL
          <input value={config.site.baseUrl} onChange={(event) => updateSite("baseUrl", event.target.value)} aria-invalid={Boolean(fieldErrors.baseUrl)} />
          {fieldErrors.baseUrl && <span className="field-error">{fieldErrors.baseUrl}</span>}
        </label>
      </section>

      <section className="notice">
        <h2>Publishing boundary</h2>
        <p><strong>Rendered site:</strong> only Markdown with <code>publish: true</code> is staged for Quartz.</p>
        <p><strong>Repository source:</strong> if this repo is public, committed Markdown may be visible on GitHub even when it is not rendered.</p>
        <p><strong>Expected Pages URL:</strong> {pageUrl}</p>
      </section>

      <section className="notice branding-panel">
        <h2>Generated site footer</h2>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={config.branding.showAttribution}
            onChange={(event) => updateBranding("showAttribution", event.target.checked)}
          />
          Show Markdown Pages attribution
        </label>
        <div className="grid compact-grid">
          <label>
            Attribution text
            <input
              value={config.branding.attributionText}
              onChange={(event) => updateBranding("attributionText", event.target.value)}
              disabled={!config.branding.showAttribution}
            />
          </label>
          <label>
            Attribution link
            <input
              value={config.branding.attributionUrl}
              onChange={(event) => updateBranding("attributionUrl", event.target.value)}
              disabled={!config.branding.showAttribution}
            />
          </label>
        </div>
      </section>

      <section className="next-steps">
        <h2>Next steps</h2>
        <div className="steps-grid">
          <div>
            <span>1</span>
            <h3>Edit content</h3>
            <p>Open <code>content/</code> in Obsidian and update pages, posts, and notes.</p>
          </div>
          <div>
            <span>2</span>
            <h3>Preview locally</h3>
            <p>Run <code>npm run preview</code> in a second terminal. Quartz serves the site locally and refreshes when content or config changes.</p>
          </div>
          <div>
            <span>3</span>
            <h3>Publish</h3>
            <p>Commit, push to GitHub, and enable Pages with GitHub Actions.</p>
          </div>
        </div>
      </section>

      <footer>
        <span>{status}</span>
        <span>Next: open <code>content/</code> in Obsidian, then run <code>npm run preview</code>.</span>
      </footer>
    </main>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
