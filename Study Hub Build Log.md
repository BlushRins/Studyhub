---
date: 2026-09-23
type: code-session
tags:
  - session
  - coding
  - nextjs
  - build-log
---

# Study Hub Build Log — 2026-09-23 → 09-24

How [[Study Hub]] went from an empty folder to a working note viewer: what was
built, what broke, and why each fix is the way it is.

## Target

- Project: [[Study Hub]]
- Repository: none of its own. Tracked by the vault repo (vault rule: no nested `.git`)
- Branch: n/a, nothing committed yet
- Definition of done: dark reading layout, collapsible category sidebar, scroll-spy ToC, and a `NoteViewer` with code blocks (badge, line numbers, copy), Mermaid diagrams, an image lightbox, and wikilink hover previews, all fed by hardcoded demo notes led by a RAG Architecture note.

## Before

- [x] Inspect current status: `Projects/` held two projects plus a README index; the vault is a git repo whose `.gitignore` already covers `node_modules/`
- [x] State the smallest safe change: a new folder, `Projects/Study Hub/`; the only edit to an existing file is one line in `Projects/README.md`
- [x] Identify verification and rollback: tsc, eslint, `next build`, then browser checks; rollback = delete the folder

## Work log

### 1. Scaffold

Versions checked on npm before starting: Next 16.3.6, React 19.2, Tailwind 4.3, react-markdown 10.1, rehype-pretty-code 0.14.5, shiki 4.4, mermaid 12.0, lucide-react 1.47.

```bash
# In a scratch folder: create-next-app rejects "Study Hub" as an npm package name
npx create-next-app@16.3.6 study-hub --ts --tailwind --eslint --app --import-alias "@/*" --use-npm --disable-git --skip-install --yes
cp -a study-hub/. "Projects/Study Hub/"      # then deleted README.md, boilerplate SVGs, favicon

npm install
npm install react-markdown remark-gfm rehype-pretty-code shiki mermaid lucide-react \
  rehype-slug unist-util-visit mdast-util-find-and-replace mdast-util-from-markdown mdast-util-to-string github-slugger
npm install -D @tailwindcss/typography @types/mdast @types/hast
```

- `--disable-git` because the vault forbids nested repos.
- Extra packages beyond the brief: `shiki` is a required peer of rehype-pretty-code, `rehype-slug` gives headings the ids the ToC links to, and the rest are small unified helpers for three custom plugins.
- npm 12 blocked the `unrs-resolver` postinstall script (it's covered by no `allowScripts` entry). ESLint still works, so I left it blocked.
- Next 16 ships its own docs in `node_modules/next/dist/docs/`. Read them first: `params` is a Promise, and `PageProps<'/notes/[slug]'>` is a generated global type.

### 2. Architecture decisions

- **Rendering happens on the server.** `NoteViewer` uses react-markdown's `MarkdownAsync` in a server component, and every note is prerendered at build time. Shiki highlighting therefore ships zero JavaScript to the browser.
- **`lib/notes.ts` is the only file that knows where notes come from.** Swapping demo data for the real vault means changing that one file. Note bodies never reach client components; the sidebar gets a light nav tree.
- **Plugin chain:** `remarkGfm` → `remarkMermaid` → `remarkWikiLink` → `rehypeSlug` → `rehypePrettyCode` → `rehypeCodeTitle`.
  - Mermaid fences are swapped for a placeholder *before* shiki, or shiki would syntax-highlight the diagram source.
  - rehype-pretty-code puts `title="…"` in a `<figcaption>`, so a tiny plugin moves it onto the `<pre>` for the code header.
- **Custom renderers strip the `node` prop** before handing props to client components. Otherwise the whole syntax tree gets serialised into the page payload.
- **Image-only paragraphs are unwrapped.** Markdown puts images inside `<p>`, and a `<figure>` inside a `<p>` is invalid HTML, which causes a hydration error.
- **The wikilink hover card is built only from `<span>`s**, because it lives inside a paragraph. It uses `position: fixed`, flips above the link near the viewport bottom, and clamps to the screen edges.
- **Sidebar collapse is stored in localStorage and read through `useSyncExternalStore`.** The server and client renders agree, so there's no hydration warning, and an in-memory fallback covers blocked storage.

### 3. Problems hit and how they were fixed

| # | Problem | Cause | Fix |
|---|---|---|---|
| 1 | `tsc` couldn't find `PageProps` / `LayoutProps` | Next generates them into `.next/types` | Run `npx next typegen` (or `dev` / `build`) before a bare `tsc` |
| 2 | RAG flowchart ~1,500px wide and unreadable | `LR` layout with two subgraphs side by side | `TB` overall. Link whole subgraphs (`ingest --> VS`) instead of inner nodes so each subgraph keeps `direction LR`. Result: 3 compact rows |
| 3 | ToC highlight went stale after page jumps | IntersectionObserver only reports headings whose visibility *changes*; a scrollbar drag or End key skips right past them | rAF-throttled scroll check, plus "at the page bottom, the last heading wins" for short final sections |
| 4 | Lightbox couldn't reopen after closing | React state only reset on the native dialog `close` event, which is queued asynchronously and can be missed | Closing driven by React state (close button, Esc via `cancel`, stage click); `onClose` kept as a fallback |
| 5 | Desktop sidebar toggle showed on mobile | `hidden` and `inline-flex` both set `display`; CSS order picked `inline-flex` | Shared button classes no longer set `display`; each button sets its own |
| 6 | Tree diagram circles had r≈93 around "50" | Mermaid 12 changed defaults: `look: "neo"` (+32px padding) and `flowchart.minNodeWidth: 120` | `look: "classic"`, `minNodeWidth: 0`, matching mermaid 11 and Obsidian's renderer |
| 7 | Hover card rendered 310px, not 320px | Pop-in animation frozen mid-way in a hidden browser tab (test artifact) | Nothing to fix. The animation uses the individual `scale` property so it can't fight the card's `transform` |

### 4. Demo content

- **RAG Architecture** (the flagship):
  - Mermaid pipeline diagram
  - whiteboard sketch (hand-drawn SVG) in the lightbox
  - tuning table
  - LangChain.js chain with highlighted lines, written in LCEL
  - discriminated-union typing example
  - failure modes, eval checklist
- **Binary Search Trees**: Mermaid tree with the search path highlighted, plus an iterative insert in TypeScript.
- **Six short notes** so every wikilink resolves and has a hover summary. `[[Reranking]]` is deliberately left unresolved to show the missing-note style.
- LangChain import paths and constructor params were checked against the published type definitions. The snippet is display-only, and LangChain isn't installed.

## Verification

- **Commands run:** `npx tsc --noEmit` → exit 0; `npx eslint` → exit 0; `npx next build` → all 8 notes prerendered, plus `/`, `/_not-found`, `/icon.svg`
- **Result** (checked in the Claude browser pane against the dev server):
  - Code blocks: filename header, language badge, line numbers, 7 highlighted lines. Copy returns exactly the 46 source lines, with no line numbers.
  - Mermaid: renders on both diagram notes. Source toggle and expand work, and zoom reaches 200%.
  - Lightbox and diagram dialogs:
    - open, zoom, and close via button, Esc, and a click on the empty stage
    - clicking the image itself keeps the dialog open
    - scroll lock applies while open and is released on close
  - Wikilinks: 5 resolved, 1 dimmed placeholder. The hover card shows category, title, summary and tags, and flips above near the viewport bottom.
  - ToC: correct active heading after jumps, anchor offsets and the page bottom.
  - Sidebar: accordion (closed panels are `inert`), collapse to icon rail, state survives a reload with no console errors, rail icon re-expands.
  - Mobile (375px): hamburger drawer, Esc closes it, tapping a note navigates and closes it. Zero horizontal page overflow; code and tables scroll inside their own boxes.
  - `/notes/does-not-exist` returns a real 404 with the styled page. Every note returns 200 with backlinks.
- **Remaining risks:**
  - Keyboard focus showing hover cards wasn't observable in the hidden test pane (no document focus). The code path is `onFocus` and the same as hover.
  - The RAG diagram renders at about 73% scale at article width. Expand covers close reading.

## Handoff

- **Commit or checkpoint:** nothing committed. The folder shows as untracked in the vault repo.
- **Next action:** in Obsidian, add `node_modules/` to Settings → Files & links → Excluded files. Then start the vault loader in `lib/notes.ts` (see [[Study Hub]] → Next).
- Dev-server launch config for Claude's browser pane: `~/Documents/.claude/launch.json` (outside the vault).
