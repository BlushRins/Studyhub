"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ListTree } from "lucide-react";
import type { TocHeading } from "@/lib/types";
import { cx } from "@/lib/utils";

/** Distance from the top of the viewport that counts as "reading here" (below the sticky header). */
const READING_LINE = 96;

export default function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  // Scroll-spy. A rAF-throttled scroll check rather than IntersectionObserver:
  // IO only reports headings whose visibility *changes*, so a jump (scrollbar
  // drag, find-in-page, End key) that skips past several headings left the
  // highlight stale. Measuring ~10 headings per frame is negligible.
  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 4;
      // Short final sections can never reach the reading line; at the very
      // bottom of the page the last heading wins.
      const current = atBottom
        ? elements.at(-1)
        : elements.filter((el) => el.getBoundingClientRect().top <= READING_LINE).at(-1);
      setActiveId((current ?? elements[0]).id);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
        <ListTree aria-hidden className="size-3.5" />
        On this page
      </p>
      <ul className="border-l border-border">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={() => setActiveId(heading.id)}
                aria-current={active ? "location" : undefined}
                className={cx(
                  "-ml-px block border-l py-1 pr-2 leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                  heading.depth === 3 ? "pl-7 text-[13px]" : "pl-4",
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-subtle hover:border-border-strong hover:text-fg",
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
      <a
        href="#top"
        onClick={(event) => {
          event.preventDefault();
          window.scrollTo({ top: 0 });
          history.replaceState(null, "", window.location.pathname);
        }}
        className="mt-5 inline-flex items-center gap-1.5 text-xs text-subtle transition-colors hover:text-fg"
      >
        <ArrowUp aria-hidden className="size-3.5" />
        Back to top
      </a>
    </nav>
  );
}
