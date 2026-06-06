import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter.mjs"

const root = process.cwd()
const config = JSON.parse(await readFile(path.join(root, "word-pages.config.json"), "utf8"))
const sourceRoot = path.join(root, config.content.source)
const stagedRoot = path.join(root, config.content.staged)

const allowedTypes = new Set(["page", "post", "note"])

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function collectMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === ".obsidian") continue
      files.push(...await collectMarkdown(fullPath))
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath)
    }
  }
  return files
}

function routeFor(filePath, data) {
  const type = String(data.type ?? "").toLowerCase()
  if (!allowedTypes.has(type)) {
    throw new Error(`${filePath} has unsupported type "${data.type}". Use page, post, or note.`)
  }

  const fallbackSlug = slugify(data.title ?? path.basename(filePath, ".md"))
  const slug = slugify(data.slug ?? fallbackSlug)
  if (!slug) throw new Error(`${filePath} needs a title or slug.`)

  if (type === "post") return path.join("posts", `${slug}.md`)
  if (type === "note") return path.join("notes", `${slug}.md`)
  if (slug === "index" || slug === "home") return "index.md"
  return `${slug}.md`
}

await rm(stagedRoot, { recursive: true, force: true })
await mkdir(stagedRoot, { recursive: true })

const files = await collectMarkdown(sourceRoot)
let published = 0

for (const file of files) {
  const raw = await readFile(file, "utf8")
  const parsed = parseFrontmatter(raw)
  if (parsed.data.publish !== true) continue

  const relativeOutput = routeFor(file, parsed.data)
  const outputPath = path.join(stagedRoot, relativeOutput)
  await mkdir(path.dirname(outputPath), { recursive: true })

  const data = {
    ...parsed.data,
    title: parsed.data.title ?? path.basename(file, ".md")
  }

  await writeFile(outputPath, stringifyFrontmatter(parsed.content.trimStart(), data))
  published += 1
}

if (published === 0) {
  throw new Error("No publishable Markdown files found. Add publish: true to at least one content file.")
}

console.log(`Prepared ${published} publishable Markdown files for Quartz.`)
