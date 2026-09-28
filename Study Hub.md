---
type: project
tags: [project, nextjs, typescript, react, tailwind, obsidian]
created: 2026-09-23
status: active
updated: 2026-09-24
---

# Study Hub

Code-first web reader for technical notes. The frontend foundation for
eventually rendering this vault. Next.js 16 (App Router), TypeScript, Tailwind v4.

**Outcome:** a dark, reading-optimised app that renders Obsidian-flavoured
markdown: highlighted code, Mermaid diagrams, zoomable images, and wikilinks
with hover previews.
**Next action:** replace the demo data behind `lib/notes.ts` with a loader that
reads this vault from disk.
**Definition of done (v1):** real vault notes render with every feature the demo has.

Build journal: [[Study Hub Build Log]]
Related: [[CIS-2101 Data Structures]] (the BST and hash map demo notes)

## Run it

```bash
cd "Projects/Study Hub"
npm install   # first time only
npm run dev   # http://localhost:3000
```

## Layout

| Path | Role |
|---|---|
| `app/layout.tsx` | fonts, dark theme, `AppShell` |
| `app/notes/[slug]/page.tsx` | note page: header, viewer, linked mentions, ToC |
| `components/layout/AppShell.tsx` | top bar, collapsible sidebar, mobile drawer |
| `components/layout/Sidebar.tsx` | category tree, icon rail when collapsed |
| `components/layout/TableOfContents.tsx` | scroll-spy "On this page" |
| `components/note/NoteViewer.tsx` | markdown pipeline (server component) |
| `components/note/CodeBlock.tsx` | language badge, line numbers, copy button |
| `components/note/DiagramViewer.tsx` | Mermaid → SVG, source toggle, expand |
| `components/note/ImageLightbox.tsx` | inline figure + zoom dialog |
| `components/note/ZoomDialog.tsx` | shared zoom/pan viewer (images + diagrams) |
| `components/note/WikiLink.tsx` | wikilink with hover preview card |
| `lib/markdown/` | remark/rehype plugins: wikilinks, mermaid, code titles |
| `lib/notes.ts` | data-access layer, **the one file to swap for a vault loader** |
| `data/notes.ts` | demo content: 8 notes, RAG Architecture is the flagship |

## Notes

- **Obsidian + `node_modules/`:** the installed packages include thousands of
  `.md` files. Add `node_modules/` under Settings → Files & links → Excluded
  files so they stay out of search and the graph.
- Git: no nested repo. The vault repo tracks this folder, and the project's own
  `.gitignore` covers `node_modules/`, `.next/`, and `next-env.d.ts`.
- Demo markdown lives in TypeScript template literals, so fences there use
  `~~~` instead of backticks.

## Next

- [ ] Vault loader: read `.md` + frontmatter from this vault, map folders → categories
- [ ] Obsidian callouts (`> [!note]`) and `![[image.png]]` embeds from `Resources/Attachments/`
- [ ] Search across notes
- [ ] Light theme (colours are already CSS variables)
- [ ] "On this page" dropdown for small screens
