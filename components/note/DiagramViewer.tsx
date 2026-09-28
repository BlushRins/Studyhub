"use client";

import { useEffect, useId, useState } from "react";
import { CodeXml, Maximize2, Network, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/utils";
import ZoomDialog from "./ZoomDialog";

type Mermaid = typeof import("mermaid").default;

// Load and configure mermaid once, on first use. It's ~1 MB, so it only ships
// to pages that actually contain a diagram.
let mermaidPromise: Promise<Mermaid> | null = null;
function loadMermaid() {
  mermaidPromise ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
      themeVariables: {
        darkMode: true,
        background: "#10131a",
        fontSize: "14px",
        primaryColor: "#161a23",
        primaryTextColor: "#e6e8ee",
        primaryBorderColor: "#3a4260",
        secondaryColor: "#12151d",
        tertiaryColor: "#12151d",
        lineColor: "#6b7385",
        textColor: "#c9cfdb",
        clusterBkg: "#0f1219",
        clusterBorder: "#2a3042",
        edgeLabelBackground: "#10131a",
        titleColor: "#a0a8b8",
      },
      // Mermaid 12 changed two defaults: look "neo" (+32px around circle labels)
      // and flowchart.minNodeWidth 120 (every label padded to 120px). Together
      // they drew a circle of r≈93 around "50". Classic look + content-sized
      // nodes matches mermaid 11 and Obsidian's bundled renderer.
      look: "classic",
      flowchart: { curve: "basis", padding: 14, minNodeWidth: 0 },
    });
    return mermaid;
  });
  return mermaidPromise;
}

const DIAGRAM_TYPES: Record<string, string> = {
  flowchart: "Flowchart",
  graph: "Graph",
  sequenceDiagram: "Sequence diagram",
  classDiagram: "Class diagram",
  stateDiagram: "State diagram",
  "stateDiagram-v2": "State diagram",
  erDiagram: "ER diagram",
  gantt: "Gantt chart",
  mindmap: "Mind map",
};

type RenderState =
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "error"; message: string };

interface DiagramViewerProps {
  /** Mermaid source, e.g. "flowchart LR\n  A --> B". */
  chart: string;
  title?: string;
}

export default function DiagramViewer({ chart, title }: DiagramViewerProps) {
  // useId output contains characters that aren't valid in CSS selectors, and
  // mermaid scopes its generated styles with `#<id>`.
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [state, setState] = useState<RenderState>({ status: "loading" });
  const [showSource, setShowSource] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMermaid()
      .then((mermaid) => mermaid.render(id, chart))
      .then(({ svg }) => {
        if (!cancelled) setState({ status: "ready", svg });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ status: "error", message: error instanceof Error ? error.message : String(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  const firstWord = chart.trim().split(/\s+/)[0] ?? "";
  const typeLabel = title ?? DIAGRAM_TYPES[firstWord] ?? "Diagram";
  const toggleButton =
    "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40";

  return (
    <div className="not-prose my-8 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex h-10 items-center gap-3 border-b border-border pl-4 pr-2">
        <Network aria-hidden className="size-4 shrink-0 text-link" />
        <span className="flex-1 truncate text-xs text-muted">{typeLabel}</span>
        <button
          type="button"
          onClick={() => setShowSource((v) => !v)}
          aria-pressed={showSource}
          className={cx(toggleButton, showSource ? "bg-elevated text-fg" : "text-subtle hover:bg-elevated hover:text-fg")}
        >
          <CodeXml aria-hidden className="size-3.5" />
          <span className="hidden sm:inline">Source</span>
        </button>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          disabled={state.status !== "ready"}
          aria-label="Expand diagram"
          className={cx(toggleButton, "text-subtle hover:bg-elevated hover:text-fg")}
        >
          <Maximize2 aria-hidden className="size-3.5" />
          <span className="hidden sm:inline">Expand</span>
        </button>
      </div>

      {showSource ? (
        <pre className="max-h-[28rem] overflow-auto bg-code p-4 font-mono text-[13px] leading-relaxed text-muted">
          {chart}
        </pre>
      ) : state.status === "ready" ? (
        <div
          role="img"
          aria-label={`${typeLabel}. Toggle "Source" for the text version.`}
          className="mermaid-canvas bg-dot-grid cursor-zoom-in overflow-x-auto px-4 py-6"
          onClick={() => setExpanded(true)}
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      ) : state.status === "error" ? (
        <div className="space-y-3 p-4">
          <p className="flex items-center gap-2 text-sm text-amber-300">
            <TriangleAlert aria-hidden className="size-4" />
            Couldn&apos;t render this diagram.
          </p>
          <pre className="overflow-auto rounded-lg bg-code p-3 font-mono text-xs text-subtle">{state.message}</pre>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center" aria-busy="true">
          <div className="h-40 w-4/5 animate-pulse rounded-lg bg-elevated/60" />
          <span className="sr-only">Rendering diagram…</span>
        </div>
      )}

      {state.status === "ready" && (
        <ZoomDialog open={expanded} onClose={() => setExpanded(false)} title={typeLabel}>
          <div
            className="mermaid-canvas mermaid-canvas--expanded w-[min(90vw,1200px)]"
            dangerouslySetInnerHTML={{ __html: state.svg }}
          />
        </ZoomDialog>
      )}
    </div>
  );
}
