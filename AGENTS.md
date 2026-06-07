# Word Pages Agent Notes

## Project Summary

Word Pages is an open-source npm starter that scaffolds an Obsidian-authored Markdown site into a Quartz-powered portfolio, blog, and knowledge-base site deployable to GitHub Pages.

The package is published as:

```bash
npx @codemeall/create-word-pages my-site
```

The generated site is intentionally local-first:

- Users edit `content/` as an Obsidian vault.
- The wizard writes local config only.
- Quartz builds the public static site.
- GitHub Actions deploys to GitHub Pages.
- No hosted sync, OAuth, cloud storage, or credential handling is included in v1.

## Development History

The project started from a product plan to give users a jzhao/Quartz-like public knowledge-base experience while continuing to manage content in Obsidian. The first implementation was built in `/Users/maren/Documents/k-bridge` as a scoped npm create package.

Key decisions made:

- Use Quartz 5 as the rendering engine instead of rebuilding Obsidian-compatible parsing, backlinks, graph, search, and wikilinks.
- Distribute through npm as `@codemeall/create-word-pages`.
- Scaffold a full starter repo rather than only a theme or docs.
- Use `content/` as the Obsidian vault folder inside the generated repo.
- Require `publish: true` before Markdown is staged for public rendering.
- Keep the wizard local and credential-free.
- Deploy through GitHub Actions and GitHub Pages.

The wizard was later improved because Save originally appeared unresponsive. It now has visible save states, JSON API errors, and next-step guidance.

## Repository Structure

Important files in this package repo:

- `package.json`: npm package metadata for `@codemeall/create-word-pages`.
- `bin/create-word-pages.js`: CLI entrypoint that copies `template/` into a new target folder and replaces project-name placeholders.
- `README.md`: public npm/GitHub instructions for clients.
- `template/`: the full generated starter site.

Important files inside `template/`:

- `template/package.json`: generated site commands and dependencies.
- `template/word-pages.config.json`: local site config edited by the wizard.
- `template/content/`: sample Obsidian vault with pages, posts, notes, and templates.
- `template/wizard/`: Vite React local setup wizard.
- `template/scripts/prepare-quartz-content.mjs`: stages publishable Markdown for Quartz.
- `template/scripts/install-quartz.mjs`: clones Quartz 5, installs dependencies, installs plugins from config, and writes generated Quartz config.
- `template/scripts/run-quartz.mjs`: runs Quartz from the cloned Quartz directory.
- `template/scripts/import-jekyll-posts.mjs`: imports Jekyll `_posts` into `content/posts`.
- `template/scripts/frontmatter.mjs`: small local frontmatter parser/stringifier used by scripts without external runtime deps.
- `template/quartz.config.yaml`: Quartz config template with placeholders for title and base URL.
- `template/.github/workflows/pages.yml`: GitHub Pages deployment workflow.
- `template/.npmrc`: generated-site npm cache override, `cache=.word-pages/npm-cache`.

## Generated Site Workflow

Client flow:

```bash
npx @codemeall/create-word-pages my-site
cd my-site
npm install
npm run wizard
npm run preview
```

The wizard runs at Vite's local URL, usually `http://127.0.0.1:5173/`.

Preview runs separately through Quartz, usually `http://localhost:8080`.

This separation is expected:

- `npm run wizard` edits `word-pages.config.json`.
- `npm run preview` stages content, installs/updates Quartz, and serves the static site.

Production build:

```bash
npm run build
```

GitHub Pages deploys through the included workflow on push to `main`.

## Content Model

Markdown files live in `content/`.

A file only renders if it has:

```yaml
---
publish: true
---
```

Supported content types:

```yaml
type: page
type: post
type: note
```

Routing behavior in `prepare-quartz-content.mjs`:

- `type: page` with `slug: index` or `slug: home` becomes `index.md`.
- Other `page` files become top-level `:slug.md`.
- `type: post` becomes `posts/:slug.md`.
- `type: note` becomes `notes/:slug.md`.

Quartz then handles the final generated URLs, search, graph, backlinks, tags, wikilinks, and other reading features.

Privacy rule:

- `publish: true` controls generated-site rendering only.
- It does not hide Markdown source in a public GitHub repo.
- Public repositories may expose committed Markdown even if it is not rendered.
- Private drafts should be kept outside the public repo or committed only to a private repo.

## Wizard Behavior

The local wizard edits `word-pages.config.json`.

Current fields:

- Site title
- Description
- Author or organization
- GitHub username
- Repository name
- Repository visibility guidance
- GitHub Pages base URL

The wizard derives Quartz `baseUrl` as:

- `username.github.io` for a user site repo named `username.github.io`
- `username.github.io/repository-name` for project Pages

The wizard API is implemented in `template/wizard/vite.config.ts`:

- `GET /api/config`: reads `word-pages.config.json`
- `POST /api/config`: writes `word-pages.config.json`

The React UI shows:

- Ready/loading state
- Unsaved changes
- Saving
- Saved with timestamp
- Save failed with server error message
- Next steps for content editing, preview, and publishing

## Quartz Integration

Word Pages does not depend on the npm package named `quartz`, because that package is not the official Quartz project.

Instead, generated sites clone the official Quartz repo:

```text
https://github.com/jackyzha0/quartz.git
```

The clone is stored in:

```text
.word-pages/quartz
```

Generated and cache directories:

- `.word-pages/quartz`
- `.word-pages/quartz-content`
- `.word-pages/npm-cache`
- `.word-pages/quartz/public`

These are ignored by the generated site's `.gitignore`.

The install script also runs:

```bash
npm exec quartz -- plugin install --from-config
```

This is required for Quartz 5 plugin resolution.

## Jekyll Importer

The importer supports migrating an existing Jekyll `_posts` folder:

```bash
npm run import:jekyll -- /path/to/site/_posts
```

It:

- Reads Markdown files from the `_posts` folder.
- Removes Jekyll-only fields like `layout` and `permalink`.
- Adds `type: post`.
- Adds `publish: true`.
- Preserves common frontmatter such as `title`, `date`, `category`, `tags`, `description`, and `read_time`.
- Derives slug from filename when needed.
- Copies a sibling `assets/` folder into `content/assets` when present.

The importer was tested against:

```text
/Users/maren/Documents/abdulaziz/codemeall.github.io/_posts
```

## Verification Already Performed

Validated during development:

- `npm pack --dry-run` includes only the expected package files.
- Fresh scaffold creation works.
- Generated `npm install` works with project-local npm cache.
- `npm run import:jekyll` imports the existing Jekyll posts.
- `npm run prepare:content` stages only publishable Markdown.
- Full generated `npm run build` succeeds with Quartz 5.
- Quartz emitted a static site from imported/sample Markdown.
- Wizard `GET /api/config` works.
- Wizard `POST /api/config` writes `word-pages.config.json`.
- `npm test` passes, though there are currently no real tests.

## Current Limitations

- There are no proper automated tests yet.
- The wizard is a config editor only; it does not create GitHub repositories or configure Pages.
- The wizard does not restart/rebuild preview automatically after Save.
- Quartz is cloned on first build/preview, so first run requires network access.
- Quartz/plugin versions are not pinned beyond whatever the cloned Quartz repo resolves at runtime.
- The frontmatter parser is intentionally simple and supports the v1 schema, not full YAML.
- The importer is basic and not a full Jekyll compatibility layer.
- Custom domains are documented but not automated.
- There is no hosted SaaS, OAuth flow, or team management.

## Future Scaling Ideas

High-value next steps:

- Add real tests for scaffold output, frontmatter parsing, route staging, and Jekyll import.
- Add Playwright or browser tests for wizard Save behavior.
- Add a version-pinned Quartz install strategy for reproducible builds.
- Add an update command to refresh existing generated sites.
- Add wizard support for editing starter home/about content.
- Add a preview status panel that checks whether Quartz preview is running.
- Add a deploy checklist view for GitHub Pages setup.
- Add optional `CNAME` support for custom domains.
- Add theme presets and brand configuration.
- Add agency/client setup profiles.
- Add safer private/public content workflows, such as `publish: true` plus a warning scan for drafts.
- Add CI to pack and scaffold-test the npm package before publish.
- Add docs for nontechnical users with screenshots.

Potential product expansion:

- Hosted setup wizard with GitHub OAuth.
- GitHub repo creation and Pages configuration.
- Paid templates/themes.
- Agency handoff dashboards.
- Importers for Hugo, Docusaurus, Notion exports, and generic Obsidian vaults.
- Optional private-source/public-output deployment flow.

## Publishing Notes

The npm package is scoped:

```text
@codemeall/create-word-pages
```

Clients should use:

```bash
npx @codemeall/create-word-pages my-site
```

After changes:

```bash
npm version patch
npm publish --access public
```

If npm returns a 2FA error, publish with an OTP or use a Classic Automation token with 2FA bypass.

Do not commit npm tokens. If a token is pasted into chat or logs, revoke it immediately.
