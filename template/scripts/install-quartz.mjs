import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import path from "node:path"
import { getThemePreset } from "../theme-presets.mjs"

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
const theme = getThemePreset(config.theme?.preset)
const themeColors = theme.colors
const renderedConfig = configTemplate
  .replaceAll("__MARKDOWN_PAGES_TITLE__", JSON.stringify(config.site.title))
  .replaceAll("__MARKDOWN_PAGES_BASE_URL__", JSON.stringify(baseUrl))
  .replaceAll("__MARKDOWN_PAGES_SHOW_ATTRIBUTION__", JSON.stringify(branding.showAttribution))
  .replaceAll("__MARKDOWN_PAGES_ATTRIBUTION_TEXT__", JSON.stringify(branding.attributionText))
  .replaceAll("__MARKDOWN_PAGES_ATTRIBUTION_URL__", JSON.stringify(branding.attributionUrl))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_LIGHT__", JSON.stringify(themeColors.lightMode.light))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_LIGHTGRAY__", JSON.stringify(themeColors.lightMode.lightgray))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_GRAY__", JSON.stringify(themeColors.lightMode.gray))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_DARKGRAY__", JSON.stringify(themeColors.lightMode.darkgray))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_DARK__", JSON.stringify(themeColors.lightMode.dark))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_SECONDARY__", JSON.stringify(themeColors.lightMode.secondary))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_TERTIARY__", JSON.stringify(themeColors.lightMode.tertiary))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_HIGHLIGHT__", JSON.stringify(themeColors.lightMode.highlight))
  .replaceAll("__MARKDOWN_PAGES_THEME_LIGHT_MODE_TEXT_HIGHLIGHT__", JSON.stringify(themeColors.lightMode.textHighlight))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_LIGHT__", JSON.stringify(themeColors.darkMode.light))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_LIGHTGRAY__", JSON.stringify(themeColors.darkMode.lightgray))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_GRAY__", JSON.stringify(themeColors.darkMode.gray))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_DARKGRAY__", JSON.stringify(themeColors.darkMode.darkgray))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_DARK__", JSON.stringify(themeColors.darkMode.dark))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_SECONDARY__", JSON.stringify(themeColors.darkMode.secondary))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_TERTIARY__", JSON.stringify(themeColors.darkMode.tertiary))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_HIGHLIGHT__", JSON.stringify(themeColors.darkMode.highlight))
  .replaceAll("__MARKDOWN_PAGES_THEME_DARK_MODE_TEXT_HIGHLIGHT__", JSON.stringify(themeColors.darkMode.textHighlight))

await writeFile(path.join(quartzDir, "quartz.config.yaml"), renderedConfig)
await run("npm", ["exec", "quartz", "--", "plugin", "install", "--from-config"], {
  cwd: quartzDir,
  env: {
    ...process.env,
    npm_config_cache: npmCache
  }
})

console.log(`Quartz is ready at ${quartzDir}.`)
