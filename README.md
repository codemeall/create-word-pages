# Word Pages

Word Pages turns an Obsidian-authored Markdown vault into a Quartz-powered portfolio, blog, and knowledge-base site that can be deployed to GitHub Pages.

It is designed for people who want to manage content locally in Obsidian, keep source files in GitHub, and publish a static public site without paid sync or hosted storage.

## Quick Start

Requirements:

- Node.js 22 or newer
- npm 10.9 or newer
- A GitHub account
- Obsidian, optional but recommended

Create a new site:

```bash
npx @codemeall/create-word-pages my-site
cd my-site
npm install
npm run wizard
npm run preview
```

Open the `content/` folder in Obsidian and start editing.

## How Publishing Works

Word Pages uses `content/` as the Obsidian vault. Markdown files render only when they include:

```yaml
---
title: "My page"
type: note
publish: true
---
```

Supported content types:

- `page`: portfolio/home/about pages
- `post`: blog posts under `/posts/`
- `note`: knowledge-base notes under `/notes/`

The generated site is built by Quartz and can be deployed by the included GitHub Actions workflow.

Images can live under `content/assets/images/` or root-level `assets/images/` and be embedded from Obsidian with syntax like:

```markdown
![[hero.png]]
```

During `npm run preview` or `npm run build`, Word Pages copies only image assets referenced by published Markdown into the Quartz build input and rewrites those embeds to public site paths.

## GitHub Pages Setup

1. Create a new GitHub repository.
2. Push the generated site folder to that repository.
3. In GitHub, open `Settings -> Pages`.
4. Under `Build and deployment`, set `Source` to `GitHub Actions`.
5. Push to `main`.

The included workflow builds and deploys the site automatically.

If the deploy job fails with `Failed to create deployment (status: 404)`, GitHub Pages has not been enabled for that repository yet, or the Pages source is not set to GitHub Actions. Open the URL shown in the workflow error, update `Settings -> Pages`, then rerun the workflow.

For project pages, run the wizard and set your GitHub username and repository name so the site URL is configured correctly.

## Privacy Rule

`publish: true` means “render this file into the public website.”

It does not make the Markdown source private. If the GitHub repository is public, committed Markdown files may be visible on GitHub even when they are not rendered.

For private drafts, use a private repository or keep drafts outside the published repo.

## Import Existing Jekyll Posts

If you have a Jekyll blog with `_posts`, import it like this:

```bash
npm run import:jekyll -- /path/to/site/_posts
```

The importer copies posts into `content/posts`, adds `type: post`, adds `publish: true`, and preserves common frontmatter such as title, date, tags, category, and description.

## Common Commands

```bash
npm run wizard
```

Configure site identity, GitHub Pages URL details, and visibility guidance.

```bash
npm run preview
```

Build and serve the site locally.

```bash
npm run build
```

Build the static site for production.

```bash
npm run prepare:content
```

Stage only publishable Markdown into the Quartz build input.

## Client Handoff Checklist

- Create the site with `npx @codemeall/create-word-pages client-site`.
- Run the wizard and set the correct GitHub username and repository name.
- Open `content/` in Obsidian.
- Replace the sample home, about, post, and note files.
- Commit and push to GitHub.
- Enable GitHub Pages with GitHub Actions.
- Confirm the first deployment succeeds.

## License

MIT
