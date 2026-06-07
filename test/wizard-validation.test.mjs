import test from "node:test"
import assert from "node:assert/strict"
import { validateWordPagesConfig } from "../template/wizard/src/configValidation.js"

const validConfig = {
  site: {
    title: "Markdown Pages",
    description: "",
    author: "",
    githubUsername: "octocat",
    repositoryName: "my-site",
    visibility: "ask",
    baseUrl: "octocat.github.io/my-site"
  },
  theme: {
    preset: "clean-garden"
  }
}

test("accepts a complete wizard config", () => {
  assert.equal(validateWordPagesConfig(validConfig).ok, true)
})

test("requires title and GitHub Pages fields", () => {
  const result = validateWordPagesConfig({
    site: {
      title: "",
      githubUsername: "",
      repositoryName: "",
      baseUrl: ""
    }
  })

  assert.equal(result.ok, false)
  assert.deepEqual(result.fieldErrors, {
    title: "Required",
    githubUsername: "Required",
    repositoryName: "Required",
    baseUrl: "Required"
  })
})

test("rejects invalid baseUrl values", () => {
  for (const baseUrl of ["https://octocat.github.io/site", "/site", "site/", "octocat.github.io/my site"]) {
    const result = validateWordPagesConfig({
      ...validConfig,
      site: {
        ...validConfig.site,
        baseUrl
      }
    })

    assert.equal(result.ok, false, baseUrl)
    assert.ok(result.fieldErrors.baseUrl, baseUrl)
  }
})

test("rejects unknown theme presets", () => {
  const result = validateWordPagesConfig({
    ...validConfig,
    theme: {
      preset: "mystery-theme"
    }
  })

  assert.equal(result.ok, false)
  assert.equal(result.fieldErrors.themePreset, "Choose one of the available themes")
})
