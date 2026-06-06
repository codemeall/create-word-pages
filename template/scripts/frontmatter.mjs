export function parseFrontmatter(source) {
  if (!source.startsWith("---\n")) {
    return { data: {}, content: source }
  }

  const end = source.indexOf("\n---", 4)
  if (end === -1) {
    return { data: {}, content: source }
  }

  const yaml = source.slice(4, end)
  const content = source.slice(end + 4).replace(/^\n/, "")
  return { data: parseYaml(yaml), content }
}

export function stringifyFrontmatter(content, data) {
  return `---\n${stringifyYaml(data)}---\n\n${content.trimStart()}`
}

function parseYaml(yaml) {
  const data = {}
  const lines = yaml.split("\n")
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) {
      index += 1
      continue
    }

    const [, key, rawValue] = match
    if (rawValue === "") {
      const values = []
      let cursor = index + 1
      while (cursor < lines.length) {
        const item = lines[cursor].match(/^\s*-\s*(.*)$/)
        if (!item) break
        values.push(parseScalar(item[1]))
        cursor += 1
      }
      data[key] = values
      index = cursor
      continue
    }

    data[key] = parseScalar(rawValue)
    index += 1
  }

  return data
}

function parseScalar(raw) {
  const value = raw.trim()
  if (value === "true") return true
  if (value === "false") return false
  if (value === "[]") return []
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => parseScalar(item))
      .filter((item) => item !== "")
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function stringifyYaml(data) {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []\n`
        return `${key}:\n${value.map((item) => `  - ${formatScalar(item)}`).join("\n")}\n`
      }
      return `${key}: ${formatScalar(value)}\n`
    })
    .join("")
}

function formatScalar(value) {
  if (typeof value === "boolean") return value ? "true" : "false"
  const text = String(value)
  if (!text || /[:#\n{}[\],&*?|<>=!%@`]/.test(text)) {
    return JSON.stringify(text)
  }
  return text
}
