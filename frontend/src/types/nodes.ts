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
  /// If set to true, the node gets a target handle, this is set for the initial node in a flow
  hasTargetHandle: boolean;
  // TODO: Add ticket reference
};

export type AppNodeType = "actionNode" | "statusNode";
export type StatusNode = Node<StatusNodeData, "statusNode">;
export type AppNodeData = StatusNodeData | ActionNodeData;
export type AppNode = StatusNode | ActionNode;

interface PendingNodeData<NodeType extends string> {
  // Position included in the event where the edge was dropped
  eventScreenPosition: Node["position"];
  // Node type to create
  type: NodeType;
  // Node the dropped edge is connected to
  fromNodeId?: string;
}

export type PendingAppNodeData =
  | PendingNodeData<"actionNode">
  | PendingNodeData<"statusNode">;

export function isStatusNode(node: Node): node is StatusNode {
  return node.type == "statusNode";
}

export function isActionNode(node: Node): node is StatusNode {
  return node.type == "actionNode";
}
