import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter.mjs"

const root = process.cwd()
const config = JSON.parse(await readFile(path.join(root, "word-pages.config.json"), "utf8"))
const sourceRoot = path.join(root, config.content.source)
const stagedRoot = path.join(root, config.content.staged)
const publicAssetsRoot = path.join(root, "assets")

const allowedTypes = new Set(["page", "post", "note"])
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"])

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

async function collectAssets(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const assets = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === ".obsidian") continue
      assets.push(...await collectAssets(fullPath))
    } else if (!entry.name.endsWith(".md")) {
      assets.push(fullPath)
    }
  }
  return assets
}

function normalizeAssetPath(value) {
  return value.replaceAll("\\", "/").replace(/^\/+/, "")
}

function buildAssetIndex(assetFiles) {
  const index = new Map()
  for (const { file, relativePath } of assetFiles) {
    const keys = [
      relativePath,
      relativePath.toLowerCase(),
      path.basename(relativePath),
      path.basename(relativePath).toLowerCase()
    ]

    for (const key of keys) {
      if (!index.has(key)) index.set(key, { sourcePath: file, relativePath })
    }
  }
  return index
}

async function collectAvailableAssets() {
  const contentAssets = (await collectAssets(sourceRoot)).map((file) => ({
    file,
    relativePath: normalizeAssetPath(path.relative(sourceRoot, file))
  }))

  let publicAssets = []
  try {
    publicAssets = (await collectAssets(publicAssetsRoot)).map((file) => ({
      file,
      relativePath: normalizeAssetPath(path.join("assets", path.relative(publicAssetsRoot, file)))
    }))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }

  return [...contentAssets, ...publicAssets]
}

function markdownLinkPath(fromOutputPath, assetRelativePath) {
  const fromDir = path.dirname(fromOutputPath)
  const relativePath = normalizeAssetPath(path.relative(fromDir, assetRelativePath))
  return encodeURI(relativePath.startsWith(".") ? relativePath : `./${relativePath}`)
}

function rewriteObsidianImageEmbeds(content, outputRelativePath, assetIndex, referencedAssets) {
  return content.replace(/!\[\[([^\]\r\n]+)\]\]/g, (match, rawTarget) => {
    const [rawPath, rawLabel] = rawTarget.split("|")
    const targetPath = normalizeAssetPath(rawPath.trim())
    const extension = path.extname(targetPath).toLowerCase()

    if (!imageExtensions.has(extension)) return match

    const asset = assetIndex.get(targetPath) ?? assetIndex.get(targetPath.toLowerCase()) ?? assetIndex.get(path.basename(targetPath).toLowerCase())
    if (!asset) return match

    referencedAssets.set(asset.relativePath, asset.sourcePath)

    const label = rawLabel?.trim()
    const altText = label && !/^\d+(x\d+)?$/.test(label) ? label : path.basename(asset.relativePath, extension)
    const linkPath = markdownLinkPath(outputRelativePath, asset.relativePath)
    return `![${altText}](${linkPath})`
  })
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
const assetIndex = buildAssetIndex(await collectAvailableAssets())
const referencedAssets = new Map()
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

  const content = rewriteObsidianImageEmbeds(parsed.content.trimStart(), relativeOutput, assetIndex, referencedAssets)

  await writeFile(outputPath, stringifyFrontmatter(content, data))
  published += 1
}

if (published === 0) {
  throw new Error("No publishable Markdown files found. Add publish: true to at least one content file.")
}

for (const [relativePath, sourcePath] of referencedAssets) {
  const outputPath = path.join(stagedRoot, relativePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await copyFile(sourcePath, outputPath)
}

console.log(`Prepared ${published} publishable Markdown files and ${referencedAssets.size} referenced assets for Quartz.`)
