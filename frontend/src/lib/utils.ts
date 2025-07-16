import type { AppNodeType } from "@/types/nodes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const appNodeTypeToIdPrefixMap: Record<AppNodeType, string> = {
  actionNode: "action-node",
  statusNode: "status-node",
} as const;

/**
 * Get a new, random node ID for a node type
 * @param nodeType Type of the node
 * @returns Node ID
 */
export const getNodeId = (nodeType: AppNodeType) => {
  return `${appNodeTypeToIdPrefixMap[nodeType]}-${crypto.randomUUID()}`;
};

/**
 * Whether the user agent indicates that the browser is running on macOS or iOS
 */
export const isApple = (() => {
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
})();
