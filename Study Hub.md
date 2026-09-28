---
type: project
tags: [project, nextjs, typescript, react, tailwind, obsidian, cis-2101]
created: 2026-09-23
status: active
updated: 2026-09-28
---

# Study Hub

Web reader for step-by-step study guides. It currently holds the
[[CIS-2101 Data Structures]] weeks 7–12 path: ADT Set, ADT Dictionary and
ADT Priority Queue, from fundamentals to advanced. Next.js 16 (App Router),
TypeScript, Tailwind v4.

**Outcome:** a dark, reading-optimised app that renders Obsidian-flavoured
Markdown: highlighted code, Mermaid diagrams, callouts, zoomable images, and
wikilinks with hover previews.
**Next action:** work through the learning path, starting at [[What Is an ADT]].
**Definition of done (v1):** notes live as Markdown in `content/` and render
identically in Obsidian and the app.

Build journal: [[Study Hub Build Log]]

## Run it

```bash
cd "Projects/Study Hub"
npm install   # first time only
npm run dev   # http://localhost:3000 — edits to content/*.md show on refresh
```

`npm start` serves the last `npm run build`. Rebuild after changing notes.

## Learning path (content/)

| Step | Note | Level |
|---|---|---|
| 1 | [[What Is an ADT]] | Fundamentals |
| 2 | [[Big-O and Complexity]] | Fundamentals |
| 3 | [[Bitwise Operations in C]] | Basic |
| 4 | [[ADT Set]] | Fundamentals |
| 5 | [[List-Based Sets]] | Basic |
| 6 | [[Bit-Vector Sets]] | Intermediate |
| 7 | [[Bit Vectors in the Real World]] | Advanced |
| 8 | [[ADT Dictionary]] | Fundamentals |
| 9 | [[Hash Functions]] | Basic |
| 10 | [[Open Hashing]] | Intermediate |
| 11 | [[Closed Hashing]] | Intermediate |
| 12 | [[Hash Table Performance]] | Advanced |
| 13 | [[ADT Priority Queue]] | Fundamentals |
| 14 | [[Partially Ordered Trees]] | Basic |
| 15 | [[Heaps in Arrays]] | Intermediate |
| 16 | [[Heapify and Heap Sort]] | Advanced |

Each note has goals, theory, worked traces, C code, practice problems graded
basic → advanced with foldable answers, and references. Graded course
exercises (ADT Guide bit-vector functions, hashing practice exercises, heap
insert/deletemin, heap sort) are taught with hints and self-check tests, not
solved.

## Lecture notes (separate "From class" area)

Notes transcribed from class (whiteboards, slides) live in their own sidebar
area, outside the numbered path, sorted by class date.

| Date | Note |
|---|---|
| 2026-09-28 | [[Bit-Vector Union (Lecture)]]: bit-vector set as an `int` array, union with `\|\|` |

A lecture note uses `category: lectures` and `date: YYYY-MM-DD` instead of
`step`. Photos go in `content/assets/` (cropped, resized, EXIF stripped).

## Writing a note

A Markdown file in `content/`. The filename is the title. Frontmatter:

```yaml
category: adt-set          # foundations | adt-set | adt-dictionary | adt-priority-queue | lectures
level: basic               # fundamentals | basic | intermediate | advanced
step: 5                    # position in the path, unique (lecture notes: date: YYYY-MM-DD instead)
summary: "One or two sentences for the header and hover cards."
tags: [cis-2101, ...]
updated: 2026-09-28
```

Supports GFM tables and task lists, ```` ```c title="x.c" {3-5} ```` code
blocks, ```` ```mermaid ```` diagrams, `> [!tip]` callouts (`> [!hint]-`
folds), `[[wikilinks]]`, and images from `content/assets/`.

## Layout

| Path | Role |
|---|---|
| `content/*.md` | the notes; `content/assets/` for their images |
| `lib/notes.ts` | loads and validates `content/`, wikilink resolution, backlinks, path order |
| `lib/categories.ts` | categories (sidebar order) and levels |
| `lib/markdown/` | remark/rehype plugins: callouts, wikilinks, mermaid, code titles |
| `app/notes/[slug]/page.tsx` | note page: level, step, viewer, prev/next, linked mentions, ToC |
| `app/content/[...path]/route.ts` | serves `content/assets/*` (static at build) |
| `components/note/` | NoteViewer, Callout, CodeBlock, DiagramViewer, ImageLightbox, ZoomDialog, WikiLink, LevelBadge |
| `components/layout/` | AppShell, Sidebar (step numbers), TableOfContents |

## Notes

- **Obsidian + `node_modules/`:** add `node_modules/` under Settings → Files &
  links → Excluded files so package READMEs stay out of search and the graph.
- Git: no nested repo. The project's `.gitignore` covers `node_modules/`,
  `.next/`, `next-env.d.ts`.

## Next

- [ ] Callouts and wikilinks render in Obsidian too: open a note there and compare
- [ ] Extend the path: Trees and Graphs (weeks 13+)
- [ ] Search across notes
- [ ] Light theme (colours are already CSS variables)
- [ ] "On this page" dropdown for small screens
