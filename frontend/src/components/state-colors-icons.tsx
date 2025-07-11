import type { StatusNodeState } from "@/types/nodes";
import { Ban, CircleCheck, CircleQuestionMark, TrendingUp } from "lucide-react";
import type React from "react";

/**
 * Configuration of options. Each of the options has a key and a label.
 *
 * Additionally each option must have a entry in the map, mapping an object of type {@link MapValueType}
 * for each option.
 */
export interface OptionListAndValueMap<Keys extends string, MapValueType> {
  /** List of available options */
  options: {
    /** Key of the option */
    key: Keys;
    /** Label of the option */
    label: string;
  }[];
  /** Mapping a {@link MapValueType} for each option*/
  map: Record<Keys, MapValueType>;
}

/**
 *
 */
export const statusNodeStateIconConfig: OptionListAndValueMap<
  StatusNodeState,
  React.ReactNode
> = {
  options: [
    { key: "unknown", label: "Unknown" },
    { key: "progress", label: "Progress" },
    { key: "fail", label: "Fail" },
    { key: "success", label: "Success" },
  ],
  map: {
    unknown: <CircleQuestionMark size={16} className="stroke-zinc-400" />,
    progress: <TrendingUp size={16} className="stroke-amber-400" />,
    fail: <Ban size={16} className="stroke-red-400" />,
    success: <CircleCheck size={16} className="stroke-emerald-400" />,
  },
} as const;

/**
 * Mapping status node states to node classes for the border and background, the colors are
 * chosen to provide enough contrast with the icons defined in {@link statusNodeStateIconConfig}
 * and to work with light and dark mode.
 */
export const statusNodeStateClasses: Record<
  StatusNodeState,
  {
    /** Background classes */
    bg: string;
    /** Border classes */
    border: string;
  }
> = {
  unknown: {
    bg: "bg-zinc-100 dark:bg-zinc-700",
    border: "border-zinc-300 dark:border-zinc-500",
  },
  progress: {
    bg: "bg-amber-100 dark:bg-amber-950",
    border: "border-amber-300 dark:border-amber-800",
  },
  fail: {
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-300 dark:border-red-800",
  },
  success: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    border: "border-emerald-300 dark:border-emerald-800",
  },
} as const;
