import path from "node:path"
import { pathToFileURL } from "node:url"

const conditionsModule = await import(
  pathToFileURL(path.join(process.cwd(), "quartz/plugins/loader/conditions.ts")).href
)
const { registerCondition } = conditionsModule

registerCondition("markdown-pages-graph-enabled", (props) => {
  const frontmatter = props.fileData.frontmatter ?? {}
  return frontmatter.graph !== false && frontmatter.enableGraph !== false
})
