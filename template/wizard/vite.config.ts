import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const configPath = path.resolve(process.cwd(), "word-pages.config.json")

export default defineConfig({
  root: "wizard",
  plugins: [
    react(),
    {
      name: "word-pages-config-api",
      configureServer(server) {
        server.middlewares.use("/api/config", async (req, res) => {
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
              const parsed = JSON.parse(raw)
              await writeFile(configPath, `${JSON.stringify(parsed, null, 2)}\n`)
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify({ ok: true }))
            })
            return
          }

          res.statusCode = 405
          res.end("Method not allowed")
        })
      }
    }
  ]
})
