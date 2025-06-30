import { Ban, CircleCheck, CircleQuestionMark, TrendingUp } from "lucide-react";
import type { StatusNodeState } from "../types/nodes";

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
];

// Map status note states to icons
export const statusNodeIconMap: IconMap<StatusNodeState> = {
  unknown: <CircleQuestionMark size={16} className="stroke-gray-400" />,
  progress: <TrendingUp size={16} className="stroke-amber-400" />,
  fail: <Ban size={16} className="stroke-red-500" />,
  success: <CircleCheck size={16} className="stroke-green-500" />,
};
