import {
  type Edge,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { type FlowMetadata } from "./api-types";
import type { EdgeType } from "./edge";
import type {
  ActionNodeData,
  AppNode,
  PendingAppNodeData,
  StatusNodeData,
} from "./nodes";

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
  /** Nodes of the currently opened flow */
  nodes: AppNode[];
  /** Edges of the currently opened flow */
  edges: Edge[];
  /** Currently opened flow. If no current flow is open, the {@link FlowsDialog} is opened */
  currentFlow: FlowIdAndName | null;
  /** Available flows on the server */
  flows: FlowMetadata[];
  /** Whether there are unsaved modifications in the nodes or edges */
  hasUnsavedChanges: boolean;
  /** A node that's currently being edited, set it through {@link setCurrentEditNodeData} */
  currentEditNodeData: EditAppNodeData | null;
  /** Set the node data to be edited */
  setCurrentEditNodeData: (data: EditAppNodeData | null) => void;
  /** Data of a note that is pending to be created. If this is set the CreateNodeDialog will be opened */
  pendingNodeData: PendingAppNodeData | null;
  /** Set the {@link pendingNodeData} */
  setPendingNodeData: (nodeData: PendingAppNodeData | null) => void;
  /** Array of revisions pinned for a diff. The array can only con */
  gitRevisions: string[];
  /**
   * Add a Git revision to the {@link gitRevisions}
   * @description If two revisions are in the array already, the second one is replaced
   * @param rev - Revision to add
   */
  addGitRevision: (rev: string) => void;
  /** Clear the Git revisions array */
  clearGitRevisions: () => void;
  /**
   * Create a flow on the server through the API
   * @description After successful creation of the flow, it will call {@link setNodes}, {@link setEdges}
   * and set {@link currentFlow}
   * @param name - Name of the new flow
   * @returns Whether the flow was created successfully
   */
  createFlow: (name: string) => Promise<boolean>;
  /**
   * Delete a flow on the server through the API and reload the list of available flows
   * @param id - ID of the flow to delete
   */
  deleteFlow: (id: string) => Promise<void>;
  /** Load flows metadata and store them in {@link flows} */
  loadFlowsMetadata: () => Promise<void>;
  /**
   * Load a flow from the server and store its {@link nodes} and {@link edges}
   * @param id - ID of the flow to load
   */
  loadFlow: (id: string) => Promise<void>;
  /** Save the {@link nodes} and {@link edges} of the {@link currentFlow} to the server */
  saveCurrentFlow: () => Promise<void>;
  /** Save the {@link currentFlow} to the server and close it the current flow */
  closeCurrentFlow: () => Promise<void>;
  /** ReactFlow onNodesChange callback */
  onNodesChange: OnNodesChange<AppNode>;
  /** ReactFlow onEdgesChange callback */
  onEdgesChange: OnEdgesChange;
  /** ReactFlow onConnect callback */
  onConnect: OnConnect;
  /** ReactFlow onConnectEnd callback */
  onConnectEnd: OnConnectEnd;
  /**
   * Set the globally used edge type
   * @param newType - New edge type to use
   */
  setEdgeType: (newType: EdgeType) => void;
  /**
   * Set the nodes of the flow. This is required to set the nodes from outside React components.
   * @see useReactFlow().setNodes for operations inside React components
   * @param nodes - List of nodes to set
   */
  setNodes: (nodes: AppNode[]) => void;
  /**
   * Set the edges of the flow. This is required to set the nodes from outside React components.
   * @see useReactFlow().setNodes for operations inside React components
   * @param nodes - List of nodes to set
   */
  setEdges: (edges: Edge[]) => void;
}

export interface UiState {
  /** Whether the flows dialog was opened manually. It is forcefully opened if {@link AppState::currentFlow} is null */
  isFlowsDialogOpen: boolean;
  /**
   * Set {@link isFlowsDialogOpen}
   * @param isOpen Whether to manually open or close
   */
  setIsFlowsDialogOpen: (isOpen: boolean) => void;
  /** Whether the minimap should be visible */
  isMiniMapVisible: boolean;
  /**
   * Set {@link isMiniMapVisible}
   * @param isVisible - Whether the Minimap should be visible
   */
  setIsMiniMapVisible: (isVisible: boolean) => void;
  /** Whether to use inline diffs for the diff view */
  isInlineDiff: boolean;
  /**
   * Set {@link isInlineDiff}
   * @param isInlineDiff - Whether to use an inline diff
   */
  setIsInlineDiff: (isInlineDiff: boolean) => void;
  /** Whether the help dialog should be displayed */
  isHelpDialogOpen: boolean;
  /**
   * Set {@link isHelpDialogOpen}
   * @param isOpen - Whether the dialog should be opened or closed
   */
  setIsHelpDialogOpen: (isOpen: boolean) => void;
  /** Whether the keybindings dialog should be displayed */
  isKeybindingsDialogOpen: boolean;
  /**
   * Set {@link isKeybindingsDialogOpen}
   * @param isOpen - Whether the dialog should be opened or closed
   */
  setIsKeybindingsDialogOpen: (isOpen: boolean) => void;
}
