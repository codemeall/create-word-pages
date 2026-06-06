import { spawn } from "node:child_process"
import path from "node:path"

const root = process.cwd()
const quartzDir = path.join(root, ".word-pages", "quartz")
const npmCache = path.join(root, ".word-pages", "npm-cache")
const args = process.argv.slice(2)

const child = spawn("npm", ["exec", "quartz", "--", ...args], {
  cwd: quartzDir,
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_cache: npmCache
  }
})

child.on("exit", (code) => {
  process.exit(code ?? 1)
})
