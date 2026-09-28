// Data-access layer: the only module that knows where notes come from.
// Notes are Markdown files in content/ (Obsidian-compatible: the filename is
// the title, so [[wikilinks]] resolve in the vault too). Server-only — note
// bodies must not end up in the client bundle.

import fs from "node:fs";
import path from "node:path";
import { slug as slugify } from "github-slugger";
import { parse as parseYaml } from "yaml";
import { categories, levels } from "@/lib/categories";
import { WIKI_LINK_RE } from "@/lib/markdown/remark-wiki-link";
import type { Category, CategoryId, Level, NavCategory, Note, NotePreview } from "@/lib/types";

export const CONTENT_DIR = path.join(process.cwd(), "content");
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

interface Store {
  notes: Note[];
  bySlug: Map<string, Note>;
  /** Wikilink lookup: lower-cased title or slug → note. */
  byKey: Map<string, Note>;
}

function fail(file: string, message: string): never {
  throw new Error(`content/${file}: ${message}`);
}

/** YAML turns an unquoted 2026-09-28 into a Date; normalise to "YYYY-MM-DD". */
function isoDate(value: unknown): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "");
}

/** Path notes by step, then lecture notes oldest first. */
function compareNotes(a: Note, b: Note): number {
  if (a.section !== b.section) return a.section === "path" ? -1 : 1;
  if (a.section === "path") return a.step! - b.step!;
  return a.date!.localeCompare(b.date!) || a.title.localeCompare(b.title);
}

function parseNote(file: string): Note {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const match = raw.match(FRONTMATTER_RE);
  if (!match) fail(file, "missing YAML frontmatter");

  const meta = (parseYaml(match[1]) ?? {}) as Record<string, unknown>;
  const title = typeof meta.title === "string" ? meta.title : file.replace(/\.md$/, "");

  const category = meta.category as CategoryId;
  if (!categories.some((c) => c.id === category)) fail(file, `unknown category "${String(meta.category)}"`);
  const level = meta.level as Level;
  if (!(level in levels)) fail(file, `unknown level "${String(meta.level)}"`);
  const section = categories.find((c) => c.id === category)!.section;
  if (typeof meta.summary !== "string") fail(file, "`summary` is required");

  // Path notes need a step; lecture notes need the date of the class instead.
  let step: number | null = null;
  let date: string | null = null;
  if (section === "path") {
    if (typeof meta.step !== "number") fail(file, "`step` must be a number");
    step = meta.step;
  } else {
    date = isoDate(meta.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(file, "lecture notes need `date: YYYY-MM-DD`");
  }

  return {
    slug: slugify(title),
    title,
    category,
    level,
    section,
    step,
    date,
    summary: meta.summary,
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    updated: isoDate(meta.updated),
    content: raw.slice(match[0].length),
  };
}

function load(): Store {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"));
  const notes = files.map(parseNote).sort(compareNotes);

  const bySlug = new Map<string, Note>();
  const byKey = new Map<string, Note>();
  for (const note of notes) {
    const clash =
      bySlug.get(note.slug) ?? notes.find((n) => n !== note && n.step !== null && n.step === note.step);
    if (clash) throw new Error(`content: "${note.title}" clashes with "${clash.title}" (same slug or step)`);
    bySlug.set(note.slug, note);
    byKey.set(note.title.toLowerCase(), note);
    byKey.set(note.slug, note);
  }
  return { notes, bySlug, byKey };
}

// Production builds read content/ once. In dev, re-read on every call so edits
// to the Markdown show up on refresh.
let cached: Store | null = null;
function store(): Store {
  if (process.env.NODE_ENV !== "production") return load();
  return (cached ??= load());
}

export function getAllNotes(): Note[] {
  return store().notes;
}

export function getNote(slug: string): Note | undefined {
  return store().bySlug.get(slug);
}

export function getCategory(id: CategoryId): Category {
  const category = categories.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}

export function getNavTree(): NavCategory[] {
  const { notes } = store();
  return categories.map(({ id, label, icon, section }) => ({
    id,
    label,
    icon,
    section,
    notes: notes
      .filter((note) => note.category === id)
      .map(({ slug, title, step, date, level }) => ({ slug, title, step, date, level })),
  }));
}

/** Notes in the learning path only (lecture notes excluded). */
export function getPathNotes(): Note[] {
  return store().notes.filter((note) => note.section === "path");
}

/** The notes before and after `slug` within its own section (path or lectures). */
export function getNeighbours(slug: string): { prev?: Note; next?: Note } {
  const note = store().bySlug.get(slug);
  const group = store().notes.filter((n) => n.section === note?.section);
  const index = group.findIndex((n) => n.slug === slug);
  return { prev: group[index - 1], next: group[index + 1] };
}

/** Resolve a wikilink target (title or slug, any case) to a slug. */
export function resolveWikiTarget(target: string): string | null {
  const { byKey } = store();
  const key = target.trim().toLowerCase();
  return (byKey.get(key) ?? byKey.get(slugify(key)))?.slug ?? null;
}

export function readingTime(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function getNotePreview(slug: string): NotePreview | null {
  const note = store().bySlug.get(slug);
  if (!note) return null;
  return {
    slug: note.slug,
    title: note.title,
    summary: note.summary,
    categoryLabel: getCategory(note.category).label,
    tags: note.tags,
    readingTime: readingTime(note.content),
  };
}

/** Notes that link to `slug` via a wikilink — Obsidian's "linked mentions". */
export function getBacklinks(slug: string): { slug: string; title: string; categoryLabel: string }[] {
  return store()
    .notes.filter((note) => note.slug !== slug)
    .filter((note) =>
      [...note.content.matchAll(WIKI_LINK_RE)].some((match) => resolveWikiTarget(match[1]) === slug),
    )
    .map((note) => ({
      slug: note.slug,
      title: note.title,
      categoryLabel: getCategory(note.category).label,
    }));
}
