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
import { type AppNode, type StatusNodeState } from "./nodes";

export interface Error {
  message: string;
  response?: ApiStatusDetailResponse;
}

export interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  currentProject: ProjectMetadata | null;
  projects: ProjectMetadata[];
  // Whether there is an error to display in the UI
  error: Error | null;
  // Whether there are unsaved modifications
  hasUnsavedChanges: boolean;
  // Whether saving to the API is currently ongoing
  saveOngoing: boolean;
  createProject: (name: string) => Promise<void>;
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
