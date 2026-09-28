import type { ReactNode } from "react";
import {
  Bug,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardList,
  Dumbbell,
  FlaskConical,
  Info,
  Lightbulb,
  OctagonAlert,
  Quote,
  Target,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/lib/utils";

interface Style {
  icon: LucideIcon;
  label: string;
  /** Tailwind classes for the accent: border, background tint, title colour. */
  tone: string;
}

const BLUE = "border-sky-400/60 bg-sky-400/[0.06] [--callout:#7dd3fc]";
const TEAL = "border-teal-400/60 bg-teal-400/[0.06] [--callout:#5eead4]";
const AMBER = "border-amber-400/60 bg-amber-400/[0.06] [--callout:#fcd34d]";
const RED = "border-rose-400/60 bg-rose-400/[0.06] [--callout:#fda4af]";
const VIOLET = "border-violet-400/60 bg-violet-400/[0.06] [--callout:#c4b5fd]";
const GREEN = "border-emerald-400/60 bg-emerald-400/[0.06] [--callout:#6ee7b7]";
const GRAY = "border-border-strong bg-elevated/40 [--callout:var(--muted)]";

// Obsidian's callout types and aliases, plus two study-specific ones.
const STYLES: Record<string, Style> = {
  note: { icon: Info, label: "Note", tone: BLUE },
  info: { icon: Info, label: "Info", tone: BLUE },
  abstract: { icon: ClipboardList, label: "Summary", tone: TEAL },
  summary: { icon: ClipboardList, label: "Summary", tone: TEAL },
  tldr: { icon: ClipboardList, label: "TL;DR", tone: TEAL },
  tip: { icon: Lightbulb, label: "Tip", tone: TEAL },
  hint: { icon: Lightbulb, label: "Hint", tone: TEAL },
  important: { icon: Lightbulb, label: "Important", tone: TEAL },
  success: { icon: CircleCheck, label: "Success", tone: GREEN },
  check: { icon: CircleCheck, label: "Check", tone: GREEN },
  answer: { icon: CircleCheck, label: "Answer", tone: GREEN },
  question: { icon: CircleHelp, label: "Question", tone: AMBER },
  faq: { icon: CircleHelp, label: "FAQ", tone: AMBER },
  warning: { icon: TriangleAlert, label: "Warning", tone: AMBER },
  caution: { icon: TriangleAlert, label: "Caution", tone: AMBER },
  danger: { icon: OctagonAlert, label: "Danger", tone: RED },
  failure: { icon: CircleX, label: "Failure", tone: RED },
  bug: { icon: Bug, label: "Bug", tone: RED },
  example: { icon: FlaskConical, label: "Example", tone: VIOLET },
  practice: { icon: Dumbbell, label: "Practice", tone: VIOLET },
  goal: { icon: Target, label: "Goals", tone: BLUE },
  quote: { icon: Quote, label: "Quote", tone: GRAY },
};

interface CalloutProps {
  type: string;
  title?: string;
  /** "" = static, "+" = foldable & open, "-" = foldable & closed. */
  fold?: string;
  children: ReactNode;
}

/** Obsidian-style callout. Foldable ones use native <details>, so no client JS. */
export default function Callout({ type, title, fold = "", children }: CalloutProps) {
  const style = STYLES[type] ?? STYLES.note;
  const Icon = style.icon;
  const heading = title || style.label;
  const body = <div className="callout-body px-4 pb-3 pt-0.5">{children}</div>;
  const titleRow = (
    <>
      <Icon aria-hidden className="size-4 shrink-0 text-[var(--callout)]" />
      <span className="flex-1 font-semibold text-[var(--callout)]">{heading}</span>
    </>
  );

  if (fold) {
    return (
      <details open={fold === "+"} className={cx("callout group/callout my-6 rounded-r-xl border-l-[3px]", style.tone)}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
          {titleRow}
          <ChevronRight
            aria-hidden
            className="size-4 shrink-0 text-subtle transition-transform duration-200 group-open/callout:rotate-90"
          />
        </summary>
        {body}
      </details>
    );
  }

  return (
    <div role="note" className={cx("callout my-6 rounded-r-xl border-l-[3px]", style.tone)}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-sm">{titleRow}</div>
      {body}
    </div>
  );
}
