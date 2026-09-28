import { Binary, KeyRound, Layers, Pyramid, type LucideIcon } from "lucide-react";
import type { CategoryIconKey } from "@/lib/types";

export const categoryIcons: Record<CategoryIconKey, LucideIcon> = {
  layers: Layers,
  binary: Binary,
  key: KeyRound,
  pyramid: Pyramid,
};
