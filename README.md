# Study Hub

A personal study site for my course notes: a dark, reading-focused web reader
that renders Obsidian-flavoured Markdown. Notes are plain `.md` files, so the
same files work in Obsidian and on the site.

Current content covers **CIS-2101 Data Structures**: ADTs, sets, bit vectors,
bitwise operations in C, and Big-O complexity.

## Features

- Syntax-highlighted code blocks with titles, line numbers, and a copy button
- Mermaid diagrams, with a source toggle and zoom/pan view
- Zoomable images and SVG figures
- Obsidian callouts (`> [!note]`, `> [!goal]`, …)
- `[[Wikilinks]]` with hover previews and linked mentions
- Sidebar grouped by category, plus an "On this page" table of contents

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
`react-markdown` with remark/rehype plugins, Shiki, and Mermaid.

## Running locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Adding a note

Drop a Markdown file into `content/`. The filename becomes the title, and
the frontmatter places the note in the sidebar:

```yaml
---
category: foundations      # see lib/categories.ts
level: fundamentals
step: 1                    # order within the category
summary: "One-sentence description shown in previews."
tags: [cis-2101, adt]
---
```

Images and other assets go in `content/assets/`.

## Project layout

| Path | Role |
|---|---|
| `content/` | the notes themselves (Markdown + frontmatter) |
| `app/` | routes: home, `notes/[slug]`, and asset serving |
| `components/layout/` | app shell, sidebar, table of contents |
| `components/note/` | note viewer, code blocks, diagrams, lightbox, wikilinks |
| `lib/notes.ts` | loads and indexes the notes in `content/` |
| `lib/markdown/` | custom remark/rehype plugins |

## License

[MIT](LICENSE) © 2026 BlushRins
