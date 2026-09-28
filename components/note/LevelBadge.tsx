import { levels } from "@/lib/categories";
import type { Level } from "@/lib/types";
import { cx } from "@/lib/utils";

const TONES: Record<Level, string> = {
  fundamentals: "border-sky-400/40 text-sky-300",
  basic: "border-teal-400/40 text-teal-300",
  intermediate: "border-amber-400/40 text-amber-300",
  advanced: "border-rose-400/40 text-rose-300",
};

/** Level pill with a 4-step signal meter (fundamentals = 1 bar … advanced = 4). */
export default function LevelBadge({ level, className }: { level: Level; className?: string }) {
  const { label, rank } = levels[level];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[level],
        className,
      )}
    >
      <span aria-hidden className="flex items-end gap-[2px]">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={cx("w-[3px] rounded-sm bg-current", bar > rank && "opacity-25")}
            style={{ height: 4 + bar * 2 }}
          />
        ))}
      </span>
      {label}
    </span>
  );
}
