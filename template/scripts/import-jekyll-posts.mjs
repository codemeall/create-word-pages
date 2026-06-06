import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter.mjs"

const source = process.argv[2]
if (!source) {
  console.error("Usage: npm run import:jekyll -- /path/to/site/_posts")
  process.exit(1)
}

const root = process.cwd()
const destination = path.join(root, "content", "posts")
await mkdir(destination, { recursive: true })

function slugFromJekyllName(fileName) {
  return fileName
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/\.md$/i, "")
}

const files = (await readdir(source)).filter((file) => file.endsWith(".md"))
let imported = 0

for (const file of files) {
  const fullPath = path.join(source, file)
  const raw = await readFile(fullPath, "utf8")
  const parsed = parseFrontmatter(raw)
  const slug = parsed.data.slug ?? slugFromJekyllName(file)

  const data = {
    ...parsed.data,
    type: "post",
    publish: true,
    slug,
    title: parsed.data.title ?? slug.replaceAll("-", " "),
    date: parsed.data.date ?? file.slice(0, 10)
  }

  delete data.layout
  delete data.permalink

  const outputPath = path.join(destination, `${slug}.md`)
  await writeFile(outputPath, stringifyFrontmatter(parsed.content.trimStart(), data))
  imported += 1
}

const assetSource = path.resolve(source, "..", "assets")
try {
  await cp(assetSource, path.join(root, "content", "assets"), { recursive: true, force: true })
  console.log("Copied assets into content/assets.")
} catch {
  console.log("No sibling assets folder copied.")
}

console.log(`Imported ${imported} Jekyll posts into content/posts.`)
