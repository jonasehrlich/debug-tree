import {
  type Edge,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { type ApiStatusDetailResponse, type FlowMetadata } from "./api-types";
import type { EdgeType } from "./edge";
import type {
  ActionNodeData,
  AppNode,
  StatusNodeData,
  StatusNodeState,
} from "./nodes";

export interface Error {
  message: string;
  response?: ApiStatusDetailResponse;
}

export interface FlowIdAndName {
  id: string;
  name: string;
}

interface EditNodeData<
  NodeType extends string,
  NodeDataType extends Record<string, unknown>,
> {
  id: string;
  type: NodeType;
  data: NodeDataType;
}

export type EditAppNodeData =
  | EditNodeData<"actionNode", ActionNodeData>
  | EditNodeData<"statusNode", StatusNodeData>;

export interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  currentFlow: FlowIdAndName | null;
  flows: FlowMetadata[];
  // Whether there are unsaved modifications
  hasUnsavedChanges: boolean;
  // Whether saving to the API is currently ongoing
  saveOngoing: boolean;
  // A node that's currently being edited, set it through
  editNodeData: EditAppNodeData | null;
  // Array of revisions to use for a diff
  gitRevisions: string[];
  addGitRevision: (rev: string) => void;
  clearGitRevisions: () => void;
  // Create a flow
  createFlow: (name: string) => Promise<void>;
  // Delete a flow
  deleteFlow: (id: string) => Promise<void>;
  // Load flows metadata and store them
  loadFlowsMetadata: () => Promise<void>;
  // Load a flow
  loadFlow: (id: string) => Promise<void>;
  // Save a flow
  saveCurrentFlow: () => Promise<void>;
  // Save and close the current flow
  closeCurrentFlow: () => Promise<void>;
  getNodeById: (nodeId: string) => AppNode | null;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setEdgeType: (newType: EdgeType) => void;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateStatusNodeState: (nodeId: string, state: StatusNodeState) => void;
  editNode: (data: EditAppNodeData) => void;
  // Set the node data to be edited
  setEditNodeData: (data: EditAppNodeData | null) => void;
}

export interface UiState {
  isFlowsDialogOpen: boolean;
  isMiniMapVisible: boolean;
  setIsMiniMapVisible: (isVisible: boolean) => void;
  setIsFlowsDialogOpen: (isOpen: boolean) => void;
}
