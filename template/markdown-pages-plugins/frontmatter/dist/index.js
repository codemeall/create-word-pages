function parseScalar(value) {
  const trimmed = value.trim()
  if (trimmed === "true") return true
  if (trimmed === "false") return false
  return trimmed.replace(/^["']|["']$/g, "")
}

function parseYamlBlock(source) {
  const data = {}
  const lines = source.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim()) continue

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (rawValue.trim()) {
      data[key] = parseScalar(rawValue)
      continue
    }

    const list = []
    while (lines[index + 1]?.match(/^\s+-\s+/)) {
      index += 1
      list.push(parseScalar(lines[index].replace(/^\s+-\s+/, "")))
    }
    data[key] = list
  }

  return data
}

export default (() => ({
  name: "MarkdownPagesFrontmatter",
  markdownPlugins() {
    return [
      () => {
        return (tree, file) => {
          const source = String(file.value ?? "")
          const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
          if (!match) return

          file.data.frontmatter = {
            ...(file.data.frontmatter ?? {}),
            ...parseYamlBlock(match[1]),
          }

          const endLine = match[0].split(/\r?\n/).length - 1
          tree.children = tree.children.filter((node) => {
            const startLine = node.position?.start?.line
            return !startLine || startLine > endLine
          })
        }
      },
    ]
  },
}))
