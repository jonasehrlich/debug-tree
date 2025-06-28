import { type AppNode, type StatusNodeState } from "./nodes";
import {
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";
import {
  type ApiStatusDetailResponse,
  type ProjectMetadata,
} from "./api-types";

export interface Error {
  message: string;
  response?: ApiStatusDetailResponse;
}

export interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  currentProject?: ProjectMetadata;
  projects: ProjectMetadata[];
  // Whether there is an error to display in the UI
  error?: Error;
  // Whether there are unsaved modifications
  hasUnsavedChanges: boolean;
  // Whether saving to the API is currently ongoing
  saveOngoing: boolean;
  // Load projects metadata and store them
  loadProjectsMetadata: () => Promise<void>;
  // Load a project
  loadProject: (id: string) => Promise<void>;
  // Save a project
  saveProject: (id: string) => Promise<void>;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateStatusNodeState: (nodeId: string, state: StatusNodeState) => void;
}
