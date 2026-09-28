"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Copy, FileCode2, SquareTerminal } from "lucide-react";
import { cx } from "@/lib/utils";

const LANGUAGES: Record<string, { label: string; short: string; color: string }> = {
  ts: { label: "TypeScript", short: "TS", color: "#3178c6" },
  typescript: { label: "TypeScript", short: "TS", color: "#3178c6" },
  tsx: { label: "TSX", short: "TSX", color: "#3178c6" },
  js: { label: "JavaScript", short: "JS", color: "#f1e05a" },
  javascript: { label: "JavaScript", short: "JS", color: "#f1e05a" },
  jsx: { label: "JSX", short: "JSX", color: "#f1e05a" },
  json: { label: "JSON", short: "JSON", color: "#cbcb41" },
  bash: { label: "Shell", short: "SH", color: "#89e051" },
  sh: { label: "Shell", short: "SH", color: "#89e051" },
  shell: { label: "Shell", short: "SH", color: "#89e051" },
  zsh: { label: "Shell", short: "SH", color: "#89e051" },
  python: { label: "Python", short: "PY", color: "#3572a5" },
  py: { label: "Python", short: "PY", color: "#3572a5" },
  c: { label: "C", short: "C", color: "#a8b9cc" },
  cpp: { label: "C++", short: "C++", color: "#f34b7d" },
  java: { label: "Java", short: "JAVA", color: "#b07219" },
  go: { label: "Go", short: "GO", color: "#00add8" },
  rust: { label: "Rust", short: "RS", color: "#dea584" },
  sql: { label: "SQL", short: "SQL", color: "#e38c00" },
  css: { label: "CSS", short: "CSS", color: "#a371f7" },
  html: { label: "HTML", short: "HTML", color: "#e34c26" },
  yaml: { label: "YAML", short: "YAML", color: "#cb171e" },
  md: { label: "Markdown", short: "MD", color: "#9aa3b5" },
  markdown: { label: "Markdown", short: "MD", color: "#9aa3b5" },
  plaintext: { label: "Plain text", short: "TXT", color: "#6b7385" },
};

const SHELLS = new Set(["bash", "sh", "shell", "zsh"]);

interface CodeBlockProps {
  language?: string;
  title?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export default function CodeBlock({ language = "plaintext", title, style, children }: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const lang = LANGUAGES[language] ?? {
    label: language,
    short: language.toUpperCase().slice(0, 4),
    color: "#6b7385",
  };
  const HeaderIcon = SHELLS.has(language) ? SquareTerminal : FileCode2;

  async function copy() {
    // Line numbers are CSS pseudo-elements, so textContent is exactly the source.
    // rehype-pretty-code pads empty lines with a single space; strip those.
    const text = (preRef.current?.querySelector("code")?.textContent ?? "").replace(/^ $/gm, "");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (insecure context or permission denied).
    }
  }

  return (
    <div className="code-block group/code overflow-hidden rounded-xl border border-border bg-code shadow-[0_1px_0_0_rgb(255_255_255/0.03)_inset]">
      <div className="flex h-10 items-center gap-3 border-b border-border bg-surface/60 pl-4 pr-2">
        <HeaderIcon aria-hidden className="size-4 shrink-0 text-subtle" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{title ?? lang.label}</span>

        <span
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-muted"
          title={lang.label}
        >
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: lang.color }} />
          {lang.short}
        </span>

        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code to clipboard"}
          className={cx(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs transition-colors",
            "focus-visible:outline-2 focus-visible:outline-accent",
            copied ? "text-emerald-400" : "text-subtle hover:bg-elevated hover:text-fg",
          )}
        >
          {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
        <span aria-live="polite" className="sr-only">
          {copied ? "Code copied to clipboard" : ""}
        </span>
      </div>

      <pre ref={preRef} data-language={language} style={style} tabIndex={0}>
        {children}
      </pre>
    </div>
  );
}
