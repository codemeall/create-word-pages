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

if (!await exists(path.join(quartzDir, "package.json"))) {
  await mkdir(path.dirname(quartzDir), { recursive: true })
  await run("git", ["clone", "--depth", "1", quartzRepo, quartzDir])
}

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
const renderedConfig = configTemplate
  .replaceAll("__MARKDOWN_PAGES_TITLE__", JSON.stringify(config.site.title))
  .replaceAll("__MARKDOWN_PAGES_BASE_URL__", JSON.stringify(config.site.baseUrl))

await writeFile(path.join(quartzDir, "quartz.config.yaml"), renderedConfig)
await run("npm", ["exec", "quartz", "--", "plugin", "install", "--from-config"], {
  cwd: quartzDir,
  env: {
    ...process.env,
    npm_config_cache: npmCache
  }
})

console.log(`Quartz is ready at ${quartzDir}.`)
