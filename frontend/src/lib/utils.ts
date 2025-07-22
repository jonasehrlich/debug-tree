import type { AppNodeType } from "@/types/nodes";
import { clsx, type ClassValue } from "clsx";
import log from "loglevel";
import { twMerge } from "tailwind-merge";
const logger = log.getLogger("utils");

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
 * Whether the user agent indicates that the browser is running on macOS or iOS.
 * It would be preferred to use [navigator.userAgentData](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData)
 * but that is only available in Chrome-like browsers.
 */
export const isApple = (() => {
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
})();

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    logger.debug("Copied to clipboard:", text);
  } catch (e: unknown) {
    logger.error("Error copying", text, "to clipboard:", e);
    throw e;
  }
};
