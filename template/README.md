# Word Pages Starter

Word Pages publishes an Obsidian-authored Markdown vault to GitHub Pages with a Quartz-powered reading experience.

## Quick Start

```bash
npm install
npm run wizard
npm run preview
```

Open `content/` as an Obsidian vault. Write pages, posts, and notes there. A Markdown file is rendered only when it has `publish: true` in frontmatter.

Important: `publish: true` controls whether the generated site renders a page. It does not make committed source Markdown private. If this repository is public, committed files can be visible on GitHub even when they are not rendered.

## Content Contract

Use frontmatter to classify content:

```yaml
---
title: "My post"
type: post
publish: true
date: 2026-06-06
tags:
  - writing
---
```

Supported types:

- `page`: routed to `/` when `slug: index` or `slug: home`; otherwise routed to `/:slug/`.
- `post`: routed to `/posts/:slug/`.
- `note`: routed to `/notes/:slug/`.

Wikilinks, backlinks, graph view, tags, search, and dark/light mode are provided by Quartz.

## GitHub Pages

The included workflow builds the site with GitHub Actions and publishes the generated `public/` folder. For project Pages, set your GitHub username and repository name in the wizard so the Quartz `baseUrl` is correct. Quartz expects this value without protocol or slashes, for example `octocat.github.io/my-site`.

Custom domains are supported by GitHub Pages, but Word Pages v1 only documents that workflow and does not automate DNS setup.

## Import Jekyll Posts

To import an existing Jekyll `_posts` folder:

```bash
npm run import:jekyll -- /path/to/site/_posts
```

The importer copies Markdown files into `content/posts`, preserves common frontmatter, adds `type: post`, and adds `publish: true`.
