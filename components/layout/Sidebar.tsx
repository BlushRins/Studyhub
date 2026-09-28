"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { CategoryId, NavCategory } from "@/lib/types";
import { cx } from "@/lib/utils";
import { categoryIcons } from "./category-icons";

interface SidebarProps {
  nav: NavCategory[];
  /** Desktop only: show the narrow icon rail instead of the full tree. */
  collapsed?: boolean;
  onExpand?: () => void;
  /** Called after a note link is clicked (closes the mobile drawer). */
  onNavigate?: () => void;
}

export default function Sidebar({ nav, collapsed = false, onExpand, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/notes/") ? decodeURIComponent(pathname.slice("/notes/".length)) : null;
  const activeCategory = nav.find((c) => c.notes.some((n) => n.slug === activeSlug))?.id;
  const [closed, setClosed] = useState<ReadonlySet<CategoryId>>(new Set());

  function setOpen(id: CategoryId, open: boolean) {
    setClosed((prev) => {
      const next = new Set(prev);
      if (open) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (collapsed) {
    return (
      <nav aria-label="Notes" className="flex flex-col items-center gap-1 py-4">
        {nav.map((category) => {
          const Icon = categoryIcons[category.icon];
          return (
            <button
              key={category.id}
              type="button"
              title={category.label}
              aria-label={`Open ${category.label}`}
              onClick={() => {
                setOpen(category.id, true);
                onExpand?.();
              }}
              className={cx(
                "inline-flex size-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                category.id === activeCategory
                  ? "bg-accent/10 text-accent"
                  : "text-subtle hover:bg-elevated hover:text-fg",
              )}
            >
              <Icon aria-hidden className="size-[18px]" />
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Notes" className="px-3 py-5">
      <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">Library</p>
      <ul className="space-y-1">
        {nav.map((category) => {
          const Icon = categoryIcons[category.icon];
          const open = !closed.has(category.id);
          const panelId = `nav-${category.id}`;
          return (
            <li key={category.id}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen(category.id, !open)}
                className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-fg/90 transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
              >
                <ChevronRight
                  aria-hidden
                  className={cx("size-3.5 shrink-0 text-subtle transition-transform duration-200", open && "rotate-90")}
                />
                <Icon
                  aria-hidden
                  className={cx("size-4 shrink-0", category.id === activeCategory ? "text-accent" : "text-muted")}
                />
                <span className="flex-1 truncate">{category.label}</span>
                <span className="rounded-md bg-elevated px-1.5 font-mono text-[10px] text-subtle">
                  {category.notes.length}
                </span>
              </button>

              {/* grid-rows 0fr↔1fr animates height without measuring */}
              <div
                id={panelId}
                inert={!open}
                className={cx(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <ul className="ml-[1.2rem] overflow-hidden border-l border-border">
                  {category.notes.map((note) => {
                    const active = note.slug === activeSlug;
                    return (
                      <li key={note.slug}>
                        <Link
                          href={`/notes/${note.slug}`}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cx(
                            "-ml-px flex gap-2.5 border-l py-1.5 pl-4 pr-2 text-[13px] leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                            active
                              ? "border-accent font-medium text-accent"
                              : "border-transparent text-muted hover:border-border-strong hover:text-fg",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cx("mt-px font-mono text-[10px] tabular-nums", active ? "text-accent" : "text-subtle")}
                          >
                            {String(note.step).padStart(2, "0")}
                          </span>
                          <span>{note.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
