"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { NavCategory } from "@/lib/types";
import { usePersistentFlag } from "@/lib/use-persistent-flag";
import { cx } from "@/lib/utils";
import Sidebar from "./Sidebar";

interface AppShellProps {
  nav: NavCategory[];
  children: ReactNode;
}

export default function AppShell({ nav, children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = usePersistentFlag("study-hub:sidebar-collapsed");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const slug = pathname.startsWith("/notes/") ? decodeURIComponent(pathname.slice("/notes/".length)) : null;
  const category = nav.find((c) => c.notes.some((n) => n.slug === slug));
  const note = category?.notes.find((n) => n.slug === slug);
  const noteCount = nav.reduce((sum, c) => sum + c.notes.length, 0);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // No `display` here: each button sets its own, so `hidden` never fights `inline-flex`.
  const iconButton =
    "size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-fg focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-bg/80 px-3 backdrop-blur-md sm:px-4">
        <button
          type="button"
          className={cx(iconButton, "inline-flex lg:hidden")}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="mobile-nav"
        >
          <Menu aria-hidden className="size-[18px]" />
        </button>
        <button
          type="button"
          className={cx(iconButton, "hidden lg:inline-flex")}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="sidebar"
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="size-[18px]" />
          ) : (
            <PanelLeftClose aria-hidden className="size-[18px]" />
          )}
        </button>

        <Link href="/" className="flex items-center gap-2 rounded-lg px-1.5 py-1 focus-visible:outline-2 focus-visible:outline-accent">
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-link font-mono text-[13px] font-bold text-bg"
          >
            S
          </span>
          <span className="text-sm font-semibold tracking-tight">Study Hub</span>
        </Link>

        {category && note && (
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm text-subtle md:flex">
            <ChevronRight aria-hidden className="size-3.5 shrink-0" />
            <span className="shrink-0">{category.label}</span>
            <ChevronRight aria-hidden className="size-3.5 shrink-0" />
            <span aria-current="page" className="truncate text-muted">
              {note.title}
            </span>
          </nav>
        )}

        <span className="ml-auto hidden shrink-0 items-center gap-2 rounded-full border border-border px-2.5 py-1 text-[11px] text-subtle sm:inline-flex">
          <span aria-hidden className="size-1.5 rounded-full bg-teal-400" />
          CIS-2101 · {noteCount} notes
        </span>
      </header>

      <div className="flex">
        <aside
          id="sidebar"
          className={cx(
            "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 overflow-y-auto overflow-x-hidden border-r border-border bg-surface/40 transition-[width] duration-200 ease-out lg:block",
            collapsed ? "w-14" : "w-72",
          )}
        >
          <Sidebar nav={nav} collapsed={collapsed} onExpand={() => setCollapsed(false)} />
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div aria-hidden className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <aside
              id="mobile-nav"
              className="absolute inset-y-0 left-0 w-[min(20rem,85vw)] animate-slide-in overflow-y-auto border-r border-border bg-surface shadow-2xl"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="text-sm font-semibold">Notes</span>
                <button type="button" className={cx(iconButton, "inline-flex")} onClick={() => setDrawerOpen(false)} aria-label="Close navigation" autoFocus>
                  <X aria-hidden className="size-[18px]" />
                </button>
              </div>
              <Sidebar nav={nav} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
