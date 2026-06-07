---
title: "Publishing Model"
type: note
slug: publishing-model
publish: true
tags:
  - docs
  - github-pages
---

# Publishing Model

Markdown Pages stages publishable notes into Quartz routes before building the static site.

- `page` content becomes top-level pages.
- `post` content becomes `/posts/:slug/`.
- `note` content becomes `/notes/:slug/`.

Only files with `publish: true` are rendered. Source privacy still depends on repository visibility.

Images embedded from published Markdown with Obsidian syntax, such as `![[hero.png]]`, are copied into the generated site when they exist in `content/assets/` or root-level `assets/`.
