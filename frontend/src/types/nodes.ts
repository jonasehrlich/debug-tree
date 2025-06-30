import type { Node } from "@xyflow/react";

interface GitMetadata {
  rev: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ActionNodeData = {
  title: string;
  description: string;
};

export type ActionNode = Node<ActionNodeData, "actionNode">;

export type StatusNodeState = "unknown" | "fail" | "progress" | "success";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type StatusNodeData = {
  title: string;
  state: StatusNodeState;
  description: string;
  git: GitMetadata;
  // TODO: Add ticket reference
};

export type AppNodeType = "actionNode" | "statusNode";
export type StatusNode = Node<StatusNodeData, "statusNode">;
export type AppNodeData = StatusNodeData | ActionNodeData;
export type AppNode = StatusNode | ActionNode;
