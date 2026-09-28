// Shared shapes. Types only — safe to import from client components.

export type CategoryId = "foundations" | "adt-set" | "adt-dictionary" | "adt-priority-queue";

export type CategoryIconKey = "layers" | "binary" | "key" | "pyramid";

export type Level = "fundamentals" | "basic" | "intermediate" | "advanced";

export interface Category {
  id: CategoryId;
  label: string;
  icon: CategoryIconKey;
}

export interface Note {
  slug: string;
  title: string;
  category: CategoryId;
  level: Level;
  /** Position in the learning path, 1-based and unique across all notes. */
  step: number;
  /** One or two sentences. Shown under the title and in wiki-link hover cards. */
  summary: string;
  tags: string[];
  /** ISO date (YYYY-MM-DD). */
  updated: string;
  /** Obsidian-flavoured markdown: GFM, callouts, ```mermaid fences, [[wikilinks]]. */
  content: string;
}

/** Lightweight nav tree handed to the client sidebar (no note bodies). */
export interface NavCategory {
  id: CategoryId;
  label: string;
  icon: CategoryIconKey;
  notes: { slug: string; title: string; step: number; level: Level }[];
}

/** Everything a wiki-link hover card needs, serialisable across the RSC boundary. */
export interface NotePreview {
  slug: string;
  title: string;
  summary: string;
  categoryLabel: string;
  tags: string[];
  readingTime: number;
}

export interface TocHeading {
  id: string;
  text: string;
  depth: 2 | 3;
}
