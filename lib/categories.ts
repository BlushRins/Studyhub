import type { Category, Level } from "@/lib/types";

/** Sidebar order = learning order. */
export const categories: Category[] = [
  { id: "foundations", label: "Foundations", icon: "layers", section: "path" },
  { id: "adt-set", label: "ADT Set", icon: "binary", section: "path" },
  { id: "adt-dictionary", label: "ADT Dictionary", icon: "key", section: "path" },
  { id: "adt-priority-queue", label: "ADT Priority Queue", icon: "pyramid", section: "path" },
  /* Notes transcribed from class (whiteboards, slides), kept apart from the path. */
  { id: "lectures", label: "Lecture Notes", icon: "lecture", section: "lectures" },
];

export const levels: Record<Level, { label: string; rank: number }> = {
  fundamentals: { label: "Fundamentals", rank: 1 },
  basic: { label: "Basic", rank: 2 },
  intermediate: { label: "Intermediate", rank: 3 },
  advanced: { label: "Advanced", rank: 4 },
};
