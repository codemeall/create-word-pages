import { readdir, readFile, stat } from "node:fs/promises"
import { spawn } from "node:child_process"
import path from "node:path"

const root = process.cwd()
const scriptsDir = path.join(root, "scripts")
const configPath = path.join(root, "word-pages.config.json")
const quartzConfigPath = path.join(root, "quartz.config.ts")
const pollMs = 1000

let quartzProcess
let lastSnapshot = new Map()
let changeTimer
let handlingChanges = false
let pendingChanges = false
let shuttingDown = false

function runNodeScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(scriptsDir, scriptName)], {
      cwd: root,
      stdio: "inherit"
    })

    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${scriptName} exited with ${code ?? 1}`))
    })
  })
}

async function readConfig() {
  return JSON.parse(await readFile(configPath, "utf8"))
}

async function safeStat(filePath) {
  try {
    return await stat(filePath)
  } catch (error) {
    if (error.code === "ENOENT") return undefined
    throw error
  }
}

async function collectFiles(targetPath, files = []) {
  const info = await safeStat(targetPath)
  if (!info) return files

  if (info.isDirectory()) {
    const entries = await readdir(targetPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === ".obsidian" || entry.name === ".git" || entry.name === ".word-pages" || entry.name === "node_modules") {
        continue
      }

      await collectFiles(path.join(targetPath, entry.name), files)
    }
  } else if (info.isFile()) {
    files.push({ filePath: targetPath, info })
  }

  return files
}

async function snapshotWatchedFiles() {
  const config = await readConfig()
  const watchedRoots = [
    path.join(root, config.content.source),
    path.join(root, "assets"),
    configPath,
    quartzConfigPath
  ]

  const snapshot = new Map()
  for (const watchedRoot of watchedRoots) {
    for (const { filePath, info } of await collectFiles(watchedRoot)) {
      const relativePath = path.relative(root, filePath)
      snapshot.set(relativePath, `${info.mtimeMs}:${info.size}`)
    }
  }

  return snapshot
}

function diffSnapshots(previous, next) {
  const changed = []
  for (const [filePath, signature] of next) {
    if (previous.get(filePath) !== signature) changed.push(filePath)
  }

  for (const filePath of previous.keys()) {
    if (!next.has(filePath)) changed.push(filePath)
  }

  return changed
}

function startQuartz() {
  quartzProcess = spawn(process.execPath, [
    path.join(scriptsDir, "run-quartz.mjs"),
    "build",
    "-d",
    "../quartz-content",
    "--serve"
  ], {
    cwd: root,
    stdio: "inherit"
  })

  quartzProcess.on("exit", (code, signal) => {
    quartzProcess = undefined
    if (!shuttingDown && code !== 0) {
      console.error(`Quartz preview stopped unexpectedly (${signal ?? `exit ${code ?? 1}`}).`)
    }
  })
}

function stopQuartz() {
  return new Promise((resolve) => {
    if (!quartzProcess) {
      resolve()
      return
    }

    const child = quartzProcess
    child.once("exit", () => resolve())
    child.kill("SIGTERM")

    setTimeout(() => {
      if (quartzProcess === child) child.kill("SIGKILL")
    }, 5000).unref()
  })
}

async function handleChanges(changedFiles) {
  if (handlingChanges) {
    pendingChanges = true
    return
  }

  handlingChanges = true
  try {
    const configChanged = changedFiles.includes("word-pages.config.json") || changedFiles.includes("quartz.config.ts")
    const label = changedFiles.length === 1 ? changedFiles[0] : `${changedFiles.length} files`
    console.log(`\nDetected local change in ${label}. Updating preview...`)

    await runNodeScript("prepare-quartz-content.mjs")

    if (configChanged) {
      await runNodeScript("install-quartz.mjs")
      await stopQuartz()
      startQuartz()
    }

    console.log("Preview content is up to date.")
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    console.error("Fix the issue above and save again to update the preview.")
  } finally {
    handlingChanges = false
    if (pendingChanges) {
      pendingChanges = false
      lastSnapshot = await snapshotWatchedFiles()
      await handleChanges(["pending changes"])
    }
  }
}

async function pollForChanges() {
  if (shuttingDown) return

  try {
    const nextSnapshot = await snapshotWatchedFiles()
    const changedFiles = diffSnapshots(lastSnapshot, nextSnapshot)
    if (changedFiles.length > 0) {
      lastSnapshot = nextSnapshot
      clearTimeout(changeTimer)
      changeTimer = setTimeout(() => {
        handleChanges(changedFiles)
      }, 250)
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
  }
}

async function shutdown() {
  shuttingDown = true
  clearTimeout(changeTimer)
  await stopQuartz()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

await runNodeScript("prepare-quartz-content.mjs")
await runNodeScript("install-quartz.mjs")
lastSnapshot = await snapshotWatchedFiles()
startQuartz()

console.log("Watching content/, assets/, word-pages.config.json, and quartz.config.ts for local preview updates.")
setInterval(pollForChanges, pollMs).unref()
