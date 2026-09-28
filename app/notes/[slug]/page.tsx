import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, CornerDownRight } from "lucide-react";
import { categoryIcons } from "@/components/layout/category-icons";
import TableOfContents from "@/components/layout/TableOfContents";
import LevelBadge from "@/components/note/LevelBadge";
import NoteViewer from "@/components/note/NoteViewer";
import { getAllNotes, getBacklinks, getCategory, getNeighbours, getNote, readingTime } from "@/lib/notes";
import { extractHeadings } from "@/lib/toc";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllNotes().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: PageProps<"/notes/[slug]">): Promise<Metadata> {
  const note = getNote((await params).slug);
  return note ? { title: note.title, description: note.summary } : {};
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function NotePage({ params }: PageProps<"/notes/[slug]">) {
  const note = getNote((await params).slug);
  if (!note) notFound();

  const category = getCategory(note.category);
  const CategoryIcon = categoryIcons[category.icon];
  const headings = extractHeadings(note.content);
  const backlinks = getBacklinks(note.slug);
  const { prev, next } = getNeighbours(note.slug);
  const total = getAllNotes().length;

  return (
    <div className="mx-auto flex max-w-[76rem] gap-12 px-5 pb-24 pt-10 sm:px-8 lg:pt-14">
      <article className="mx-auto w-full min-w-0 max-w-3xl xl:mx-0">
        <header className="mb-10 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-accent">
              <CategoryIcon aria-hidden className="size-4" />
              {category.label}
            </p>
            <LevelBadge level={note.level} />
            <span className="font-mono text-xs text-subtle">
              Step {note.step} of {total}
            </span>
          </div>
          <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {note.title}
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted">{note.summary}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-subtle">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="size-4" />
              {readingTime(note.content)} min read
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="size-4" />
              Updated <time dateTime={note.updated}>{dateFormat.format(new Date(note.updated))}</time>
            </span>
            <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
              {note.tags.map((tag) => (
                <li key={tag} className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted">
                  #{tag}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <NoteViewer content={note.content} />

        {(prev || next) && (
          <nav aria-label="Learning path" className="mt-16 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/notes/${prev.slug}`}
                className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-elevated"
              >
                <span className="flex items-center gap-1.5 text-xs text-subtle">
                  <ArrowLeft aria-hidden className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                  Previous · Step {prev.step}
                </span>
                <span className="mt-1 block font-medium text-fg group-hover:text-accent">{prev.title}</span>
              </Link>
            ) : (
              <span aria-hidden />
            )}
            {next && (
              <Link
                href={`/notes/${next.slug}`}
                className="group rounded-xl border border-border bg-surface p-4 text-right transition-colors hover:border-accent/60 hover:bg-elevated"
              >
                <span className="flex items-center justify-end gap-1.5 text-xs text-subtle">
                  Next · Step {next.step}
                  <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block font-medium text-fg group-hover:text-accent">{next.title}</span>
              </Link>
            )}
          </nav>
        )}

        {backlinks.length > 0 && (
          <footer className="mt-12 border-t border-border pt-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              Linked mentions · {backlinks.length}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {backlinks.map((link) => (
                <li key={link.slug}>
                  <Link
                    href={`/notes/${link.slug}`}
                    className="group flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-elevated"
                  >
                    <CornerDownRight aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle group-hover:text-link" />
                    <span>
                      <span className="block text-sm font-medium text-fg group-hover:text-link">{link.title}</span>
                      <span className="mt-0.5 block text-xs text-subtle">{link.categoryLabel}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </footer>
        )}
      </article>

      <aside className="hidden w-60 shrink-0 xl:block">
        <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto">
          <TableOfContents key={note.slug} headings={headings} />
        </div>
      </aside>
    </div>
  );
}
