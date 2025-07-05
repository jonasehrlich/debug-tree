import {
  type Edge,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import {
  type ApiStatusDetailResponse,
  type ProjectMetadata,
} from "./api-types";
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

export interface ProjectIdAndName {
  id: string;
  name: string;
}

export interface EditNodeData<
  NodeType extends string,
  NodeDataType extends Record<string, unknown>,
> {
  id: string;
  type: NodeType;
  data: NodeDataType;
}

export interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  currentProject: ProjectIdAndName | null;
  projects: ProjectMetadata[];
  // Whether there are unsaved modifications
  hasUnsavedChanges: boolean;
  // Whether saving to the API is currently ongoing
  saveOngoing: boolean;
  // A node that's currently being edited, set it through
  editNodeData:
    | EditNodeData<"actionNode", ActionNodeData>
    | EditNodeData<"statusNode", StatusNodeData>
    | null;
  // Create a project
  createProject: (name: string) => Promise<void>;
  // Delete a project
  deleteProject: (id: string) => Promise<void>;
  // Load projects metadata and store them
  loadProjectsMetadata: () => Promise<void>;
  // Load a project
  loadProject: (id: string) => Promise<void>;
  // Save a project
  saveCurrentProject: () => Promise<void>;
  // Save and close the current project
  closeCurrentProject: () => Promise<void>;
  getNodeById: (nodeId: string) => AppNode | null;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateStatusNodeState: (nodeId: string, state: StatusNodeState) => void;
  editNode: (
    data:
      | EditNodeData<"actionNode", ActionNodeData>
      | EditNodeData<"statusNode", StatusNodeData>,
  ) => void;
  // Set the node data to be edited
  setEditNodeData: (
    data:
      | EditNodeData<"actionNode", ActionNodeData>
      | EditNodeData<"statusNode", StatusNodeData>
      | null,
  ) => void;
}
