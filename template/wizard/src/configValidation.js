const baseUrlPattern = /^[A-Za-z0-9.-]+(\/[A-Za-z0-9._~-]+)*$/

export const requiredSiteFields = ["title", "githubUsername", "repositoryName", "baseUrl"]

export function validateWordPagesConfig(config) {
  const fieldErrors = {}
  const site = config?.site ?? {}

  for (const field of requiredSiteFields) {
    if (!String(site[field] ?? "").trim()) {
      fieldErrors[field] = "Required"
    }
  }

  const baseUrl = String(site.baseUrl ?? "").trim()
  if (baseUrl) {
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(baseUrl)) {
      fieldErrors.baseUrl = "Use the Pages URL without https://"
    } else if (/\s/.test(baseUrl)) {
      fieldErrors.baseUrl = "Remove spaces from the Pages URL"
    } else if (baseUrl.startsWith("/") || baseUrl.endsWith("/")) {
      fieldErrors.baseUrl = "Do not use leading or trailing slashes"
    } else if (!baseUrlPattern.test(baseUrl)) {
      fieldErrors.baseUrl = "Use a value like octocat.github.io/my-site"
    }
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors
  }
}
