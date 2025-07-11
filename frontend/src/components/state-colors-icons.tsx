import type { StatusNodeState } from "@/types/nodes";
import { Ban, CircleCheck, CircleQuestionMark, TrendingUp } from "lucide-react";

// A generic string key maps to a ReactNode (JSX.Element), these are the icons shown for the individual elements
export type IconMap<T extends string = string> = Record<T, React.ReactNode>;

// Define the type for a single icon option
export interface IconOption<T extends string = string> {
  value: T;
  label: string;
}

// Define the type for the iconOptions array
export type IconOptions<T extends string = string> = IconOption<T>[];

// Map status note states to labels
export const statusNodeIconOptions: IconOptions<StatusNodeState> = [
  { value: "unknown", label: "Unknown" },
  { value: "progress", label: "Progress" },
  { value: "fail", label: "Fail" },
  { value: "success", label: "Success" },
] as const;

// Map status note states to icons
export const statusNodeIconMap: IconMap<StatusNodeState> = {
  unknown: <CircleQuestionMark size={16} className="stroke-zinc-400" />,
  progress: <TrendingUp size={16} className="stroke-amber-400" />,
  fail: <Ban size={16} className="stroke-red-400" />,
  success: <CircleCheck size={16} className="stroke-emerald-400" />,
} as const;

interface StatusNodeStateColors {
  bg: string;
  border: string;
}

export const statusNodeStateColorsMap: Record<
  StatusNodeState,
  StatusNodeStateColors
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
