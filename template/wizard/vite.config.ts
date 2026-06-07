import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { validateWordPagesConfig } from "./src/configValidation.js"

const configPath = path.resolve(process.cwd(), "markdown-pages.config.json")
let printedCompletionHandoff = false

function printCompletionHandoff() {
  if (printedCompletionHandoff) return
  printedCompletionHandoff = true
  console.log(`
Markdown Pages setup saved.

Next steps:
1. Open content/ in Obsidian and edit your pages, posts, and notes.
2. In another terminal, run: npm run preview
3. When ready, commit, push to GitHub, and enable Pages with GitHub Actions.
`)
}

export default defineConfig({
  root: "wizard",
  plugins: [
    react(),
    {
      name: "markdown-pages-config-api",
      configureServer(server) {
        server.middlewares.use("/api/config", async (req, res) => {
          try {
            if (req.method === "GET") {
              const body = await readFile(configPath, "utf8")
              res.setHeader("Content-Type", "application/json")
              res.end(body)
              return
            }

            if (req.method === "POST") {
              let raw = ""
              req.on("data", (chunk) => {
                raw += chunk
              })
              req.on("end", async () => {
                try {
                  const parsed = JSON.parse(raw)
                  const validation = validateWordPagesConfig(parsed)
                  if (!validation.ok) {
                    res.statusCode = 400
                    res.setHeader("Content-Type", "application/json")
                    res.end(JSON.stringify({
                      ok: false,
                      message: "Complete the required fields before saving.",
                      fieldErrors: validation.fieldErrors
                    }))
                    return
                  }

                  await writeFile(configPath, `${JSON.stringify(parsed, null, 2)}\n`)
                  printCompletionHandoff()
                  res.setHeader("Content-Type", "application/json")
                  res.end(JSON.stringify({ ok: true, path: configPath }))
                } catch (error) {
                  res.statusCode = 500
                  res.setHeader("Content-Type", "application/json")
                  res.end(JSON.stringify({
                    ok: false,
                    message: error instanceof Error ? error.message : "Could not save configuration"
                  }))
                }
              })
              return
            }

            res.statusCode = 405
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ ok: false, message: "Method not allowed" }))
          } catch (error) {
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({
              ok: false,
              message: error instanceof Error ? error.message : "Configuration API failed"
            }))
          }
        })
      }
    }
  ]
})
