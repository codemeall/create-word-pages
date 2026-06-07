#!/usr/bin/env node

import { cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, "..")
const templateRoot = path.join(packageRoot, "template")
const templateDotfiles = new Map([
  ["_gitignore", ".gitignore"],
  ["_npmrc", ".npmrc"]
])

const rawTarget = process.argv[2] ?? "word-pages-site"
const targetDir = path.resolve(process.cwd(), rawTarget)
const projectName = path.basename(targetDir)

async function ensureEmptyOrCreate(dir) {
  await mkdir(dir, { recursive: true })
  const entries = await readdir(dir)
  if (entries.length > 0) {
    throw new Error(`Target directory is not empty: ${dir}`)
  }
}

async function replacePlaceholders(filePath) {
  const info = await stat(filePath)
  if (!info.isFile()) return

  const textExtensions = new Set([
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml"
  ])

  if (!textExtensions.has(path.extname(filePath))) return

  const source = await readFile(filePath, "utf8")
  const updated = source.replaceAll("__WORD_PAGES_PROJECT_NAME__", projectName)
  if (updated !== source) {
    await writeFile(filePath, updated)
  }
}

async function restoreTemplateDotfiles(dir) {
  for (const [templateName, dotfileName] of templateDotfiles) {
    const source = path.join(dir, templateName)
    if (!await exists(source)) continue

    await cp(source, path.join(dir, dotfileName))
  }
}

async function exists(filePath) {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

async function walk(dir, visitor) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, visitor)
    } else {
      await visitor(fullPath)
    }
  }
}

try {
  await ensureEmptyOrCreate(targetDir)
  await cp(templateRoot, targetDir, { recursive: true })
  await restoreTemplateDotfiles(targetDir)
  await walk(targetDir, replacePlaceholders)

  console.log(`Created Word Pages starter in ${targetDir}`)
  console.log("")
  console.log("Next steps:")
  console.log(`  cd ${path.relative(process.cwd(), targetDir) || "."}`)
  console.log("  npm install")
  console.log("  npm run wizard")
  console.log("  npm run preview")
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
