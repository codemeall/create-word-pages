import test from "node:test"
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const repoRoot = path.resolve(import.meta.dirname, "..")

test("stages referenced Obsidian image embeds for routed pages", async () => {
  const siteRoot = await mkdtemp(path.join(tmpdir(), "markdown-pages-assets-"))
  await cp(path.join(repoRoot, "template", "scripts"), path.join(siteRoot, "scripts"), { recursive: true })

  await writeFile(path.join(siteRoot, "markdown-pages.config.json"), JSON.stringify({
    content: {
      source: "content",
      staged: ".markdown-pages/quartz-content"
    }
  }))

  await mkdir(path.join(siteRoot, "content", "pages"), { recursive: true })
  await mkdir(path.join(siteRoot, "content", "assets", "images"), { recursive: true })
  await writeFile(path.join(siteRoot, "content", "assets", "images", "hero.png"), "fake image")
  await writeFile(path.join(siteRoot, "content", "assets", "images", "draft.png"), "draft image")
  await writeFile(path.join(siteRoot, "content", "pages", "home.md"), `---
title: Home
type: page
slug: home
publish: true
---

# Home

![[hero.png]]
`)

  await execFileAsync(process.execPath, ["scripts/prepare-quartz-content.mjs"], { cwd: siteRoot })

  const stagedHome = await readFile(path.join(siteRoot, ".markdown-pages", "quartz-content", "index.md"), "utf8")
  assert.match(stagedHome, /!\[hero\]\(\.\/assets\/images\/hero\.png\)/)

  const stagedImage = await readFile(path.join(siteRoot, ".markdown-pages", "quartz-content", "assets", "images", "hero.png"), "utf8")
  assert.equal(stagedImage, "fake image")

  await assert.rejects(
    readFile(path.join(siteRoot, ".markdown-pages", "quartz-content", "assets", "images", "draft.png"), "utf8"),
    { code: "ENOENT" }
  )
})

test("uses route-relative paths for post image embeds", async () => {
  const siteRoot = await mkdtemp(path.join(tmpdir(), "markdown-pages-post-assets-"))
  await cp(path.join(repoRoot, "template", "scripts"), path.join(siteRoot, "scripts"), { recursive: true })

  await writeFile(path.join(siteRoot, "markdown-pages.config.json"), JSON.stringify({
    content: {
      source: "content",
      staged: ".markdown-pages/quartz-content"
    }
  }))

  await mkdir(path.join(siteRoot, "content", "posts"), { recursive: true })
  await mkdir(path.join(siteRoot, "assets", "images"), { recursive: true })
  await writeFile(path.join(siteRoot, "assets", "images", "post.png"), "fake image")
  await writeFile(path.join(siteRoot, "content", "posts", "hello.md"), `---
title: Hello
type: post
publish: true
---

![[post.png|Post image]]
`)

  await execFileAsync(process.execPath, ["scripts/prepare-quartz-content.mjs"], { cwd: siteRoot })

  const stagedPost = await readFile(path.join(siteRoot, ".markdown-pages", "quartz-content", "posts", "hello.md"), "utf8")
  assert.match(stagedPost, /!\[Post image\]\(\.\.\/assets\/images\/post\.png\)/)
})

test("preserves graph frontmatter settings for Quartz layout conditions", async () => {
  const siteRoot = await mkdtemp(path.join(tmpdir(), "markdown-pages-graph-frontmatter-"))
  await cp(path.join(repoRoot, "template", "scripts"), path.join(siteRoot, "scripts"), { recursive: true })

  await writeFile(path.join(siteRoot, "markdown-pages.config.json"), JSON.stringify({
    content: {
      source: "content",
      staged: ".markdown-pages/quartz-content"
    }
  }))

  await mkdir(path.join(siteRoot, "content", "notes"), { recursive: true })
  await writeFile(path.join(siteRoot, "content", "notes", "private-map.md"), `---
title: Private Map
type: note
publish: true
graph: false
---

# Private Map
`)

  await execFileAsync(process.execPath, ["scripts/prepare-quartz-content.mjs"], { cwd: siteRoot })

  const stagedNote = await readFile(path.join(siteRoot, ".markdown-pages", "quartz-content", "notes", "private-map.md"), "utf8")
  assert.match(stagedNote, /graph: false/)
})
