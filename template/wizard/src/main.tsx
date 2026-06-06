import React, { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

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
  content: {
    source: string
    staged: string
  }
}

function deriveBaseUrl(username: string, repositoryName: string) {
  if (!username || !repositoryName) return ""
  if (repositoryName.toLowerCase() === `${username.toLowerCase()}.github.io`) return `${username}.github.io`
  return `${username}.github.io/${repositoryName}`
}

function displayPagesUrl(baseUrl: string) {
  return baseUrl ? `https://${baseUrl}/` : "Configure GitHub details to preview the Pages URL."
}

function App() {
  const [config, setConfig] = useState<WordPagesConfig | null>(null)
  const [status, setStatus] = useState("Loading")

  useEffect(() => {
    fetch("/api/config")
      .then((response) => response.json())
      .then((data) => {
        setConfig(data)
        setStatus("Ready")
      })
      .catch(() => setStatus("Could not load configuration"))
  }, [])

  const pageUrl = useMemo(() => {
    if (!config?.site.githubUsername || !config.site.repositoryName) return "Configure GitHub details to preview the Pages URL."
    return displayPagesUrl(deriveBaseUrl(config.site.githubUsername, config.site.repositoryName))
  }, [config])

  if (!config) {
    return <main className="shell"><p>{status}</p></main>
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
  }

  async function save() {
    setStatus("Saving")
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    })
    setStatus(response.ok ? "Saved" : "Save failed")
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Word Pages setup</p>
          <h1>Configure your Obsidian-powered site.</h1>
          <p className="lede">This wizard writes local configuration only. It does not ask for GitHub credentials and does not upload your vault.</p>
        </div>
        <button onClick={save}>Save</button>
      </section>

      <section className="grid">
        <label>
          Site title
          <input value={config.site.title} onChange={(event) => updateSite("title", event.target.value)} />
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
          <input value={config.site.githubUsername} onChange={(event) => updateSite("githubUsername", event.target.value)} />
        </label>
        <label>
          Repository name
          <input value={config.site.repositoryName} onChange={(event) => updateSite("repositoryName", event.target.value)} />
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
          <input value={config.site.baseUrl} onChange={(event) => updateSite("baseUrl", event.target.value)} />
        </label>
      </section>

      <section className="notice">
        <h2>Publishing boundary</h2>
        <p><strong>Rendered site:</strong> only Markdown with <code>publish: true</code> is staged for Quartz.</p>
        <p><strong>Repository source:</strong> if this repo is public, committed Markdown may be visible on GitHub even when it is not rendered.</p>
        <p><strong>Expected Pages URL:</strong> {pageUrl}</p>
      </section>

      <footer>
        <span>{status}</span>
        <span>Next: open <code>content/</code> in Obsidian, then run <code>npm run preview</code>.</span>
      </footer>
    </main>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
