"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Clock, FileText } from "lucide-react";
import type { NotePreview } from "@/lib/types";

const CARD_WIDTH = 320;
const CARD_HEIGHT_ESTIMATE = 190;
const GAP = 8;
const EDGE = 12;
const OPEN_DELAY = 150;
const CLOSE_DELAY = 120;

type Position = { top: number; left: number; width: number; placement: "above" | "below" };

interface WikiLinkProps {
  href: string;
  preview: NotePreview;
  children: ReactNode;
}

/**
 * An Obsidian-style [[wikilink]] with a hover/focus preview card.
 *
 * It renders inside <p>, so the card is built from <span>s only. It's
 * position: fixed and measured from the link, so no ancestor overflow can clip
 * it: it flips above the link near the bottom of the viewport and clamps to
 * the left/right edges.
 */
export default function WikiLink({ href, preview, children }: WikiLinkProps) {
  const cardId = useId();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  // While open: any scroll or Esc dismisses the card.
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [position]);

  function show() {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      const rect = linkRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(CARD_WIDTH, window.innerWidth - EDGE * 2);
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - width / 2, EDGE),
        window.innerWidth - width - EDGE,
      );
      const fitsBelow = rect.bottom + GAP + CARD_HEIGHT_ESTIMATE < window.innerHeight;
      setPosition(
        fitsBelow
          ? { top: rect.bottom + GAP, left, width, placement: "below" }
          : { top: rect.top - GAP, left, width, placement: "above" },
      );
    }, OPEN_DELAY);
  }

  function hide() {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPosition(null), CLOSE_DELAY);
  }

  const keepOpen = () => clearTimeout(closeTimer.current);

  return (
    <span onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <Link ref={linkRef} href={href} className="wikilink" aria-describedby={position ? cardId : undefined}>
        {children}
      </Link>

      {position && (
        <span
          id={cardId}
          role="tooltip"
          onMouseEnter={keepOpen}
          onMouseLeave={hide}
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            transform: position.placement === "above" ? "translateY(-100%)" : undefined,
          }}
          className="not-prose fixed z-50 block animate-pop-in rounded-xl border border-border-strong bg-elevated/95 p-4 text-left shadow-2xl shadow-black/50 backdrop-blur"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-link">
            <FileText aria-hidden className="size-3.5" />
            {preview.categoryLabel}
          </span>
          <span className="mt-2 block text-[15px] font-semibold leading-snug text-fg">{preview.title}</span>
          <span className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">{preview.summary}</span>
          <span className="mt-3 flex flex-wrap items-center gap-1.5">
            {preview.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[10px] text-subtle">
                #{tag}
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-subtle">
              <Clock aria-hidden className="size-3" />
              {preview.readingTime} min
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
