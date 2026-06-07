import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import path from "node:path"

const root = process.cwd()
const quartzDir = path.join(root, ".markdown-pages", "quartz")
const npmCache = path.join(root, ".markdown-pages", "npm-cache")
const quartzRepo = "https://github.com/jackyzha0/quartz.git"

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options
    })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`))
    })
  })
}

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function installMarkdownPagesGraphCondition() {
  const conditionsPath = path.join(quartzDir, "quartz", "plugins", "loader", "conditions.ts")
  if (!await exists(conditionsPath)) return

  const source = await readFile(conditionsPath, "utf8")
  if (source.includes("\"markdown-pages-graph-enabled\"")) return

  const marker = "const builtinConditions: Record<string, ConditionPredicate> = {\n"
  const condition = `  "markdown-pages-graph-enabled": (props) => {
    const frontmatter = props.fileData.frontmatter ?? {}
    return frontmatter.graph !== false && frontmatter.enableGraph !== false
  },
`

  if (source.includes(marker)) {
    await writeFile(conditionsPath, source.replace(marker, marker + condition))
  }
}

if (!await exists(path.join(quartzDir, "package.json"))) {
  await mkdir(path.dirname(quartzDir), { recursive: true })
  await run("git", ["clone", "--depth", "1", quartzRepo, quartzDir])
}

await installMarkdownPagesGraphCondition()

if (!await exists(path.join(quartzDir, "node_modules"))) {
  await mkdir(npmCache, { recursive: true })
  await run("npm", ["install"], {
    cwd: quartzDir,
    env: {
      ...process.env,
      npm_config_cache: npmCache
    }
  })
}

const config = JSON.parse(await readFile(path.join(root, "markdown-pages.config.json"), "utf8"))
const configTemplate = await readFile(path.join(root, "quartz.config.yaml"), "utf8")
const baseUrl = config.site.baseUrl && config.site.baseUrl !== "/" ? config.site.baseUrl : "example.com"
const branding = {
  showAttribution: config.branding?.showAttribution !== false,
  attributionText: config.branding?.attributionText || "Built with Markdown Pages",
  attributionUrl: config.branding?.attributionUrl || "https://www.npmjs.com/package/@codemeall/create-markdown-pages"
}
const renderedConfig = configTemplate
  .replaceAll("__MARKDOWN_PAGES_TITLE__", JSON.stringify(config.site.title))
  .replaceAll("__MARKDOWN_PAGES_BASE_URL__", JSON.stringify(baseUrl))
  .replaceAll("__MARKDOWN_PAGES_SHOW_ATTRIBUTION__", JSON.stringify(branding.showAttribution))
  .replaceAll("__MARKDOWN_PAGES_ATTRIBUTION_TEXT__", JSON.stringify(branding.attributionText))
  .replaceAll("__MARKDOWN_PAGES_ATTRIBUTION_URL__", JSON.stringify(branding.attributionUrl))

await writeFile(path.join(quartzDir, "quartz.config.yaml"), renderedConfig)
await run("npm", ["exec", "quartz", "--", "plugin", "install", "--from-config"], {
  cwd: quartzDir,
  env: {
    ...process.env,
    npm_config_cache: npmCache
  }
})

console.log(`Quartz is ready at ${quartzDir}.`)
