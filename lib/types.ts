// Shared shapes. Types only — safe to import from client components.

export type CategoryId = "foundations" | "adt-set" | "adt-dictionary" | "adt-priority-queue" | "lectures";

export type CategoryIconKey = "layers" | "binary" | "key" | "pyramid" | "lecture";

/** "path" = the step-by-step learning path; "lectures" = dated class notes. */
export type Section = "path" | "lectures";

export type Level = "fundamentals" | "basic" | "intermediate" | "advanced";

export interface Category {
  id: CategoryId;
  label: string;
  icon: CategoryIconKey;
  section: Section;
}

export interface Note {
  slug: string;
  title: string;
  category: CategoryId;
  level: Level;
  section: Section;
  /** Position in the learning path (1-based, unique). null for lecture notes. */
  step: number | null;
  /** Lecture date (YYYY-MM-DD) for lecture notes; null for path notes. */
  date: string | null;
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
  section: Section;
  notes: { slug: string; title: string; step: number | null; date: string | null; level: Level }[];
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
