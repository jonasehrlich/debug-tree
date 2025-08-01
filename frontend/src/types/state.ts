import type { GitMetadata, GitStatus } from "@/client";
import {
  type Edge,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { type FlowMetadata } from "./api-types";
import type { EdgeType } from "./edge";
import type { AppNode, EditAppNodeData, PendingAppNodeData } from "./nodes";

export interface FlowIdAndName {
  id: string;
  name: string;
}

interface NodesAndEdges {
  nodes: AppNode[];
  edges: Edge[];
}

export interface AppState {
  /** Nodes of the currently opened flow */
  nodes: AppNode[];
  /** Edges of the currently opened flow */
  edges: Edge[];
  /** Undo stack, array of nodes and edges to get back to */
  undoStack: NodesAndEdges[];
  /** Whether an undo is currently in progress.
   * This is used to avoid pushing node changes while an undo is in progress to the undo stack
   */
  undoInProgress: boolean;
  /** Undo and go back to the previous state */
  undo: () => void;
  /** Push current nodes and edges to the undo stack */
  pushToUndoStack: () => void;
  /** Undo stack, array of nodes and edges to go forward to */
  redoStack: NodesAndEdges[];
  /** Redo and go back to the state that was just undone */
  redo: () => void;
  /** Currently opened flow. If no current flow is open, the {@link FlowsDialog} is opened */
  currentFlow: FlowIdAndName | null;
  /** Available flows on the server */
  flows: FlowMetadata[];
  /** Whether there are unsaved modifications in the nodes or edges */
  hasUnsavedChanges: boolean;
  /** Set the node data to be edited */
  setCurrentEditNodeData: (data: EditAppNodeData | null) => void;
  /** Set the {@link pendingNodeData} */
  setPendingNodeData: (nodeData: PendingAppNodeData | null) => void;
  /** Node data that opens a dialog, this can either trigger a create node dialog or an edit node dialog */
  dialogNodeData:
    | { type: "pending"; data: PendingAppNodeData }
    | { type: "edit"; data: EditAppNodeData }
    | null;
  /** Array of revisions pinned for a diff. The array can only con */
  pinnedGitRevisions: [GitMetadata | null, GitMetadata | null];
  /**
   * Add a Git revision to the {@link pinnedGitRevisions}
   * @description If two revisions are in the array already, the second one is replaced
   * @param rev - Revision to add
   */
  addPinnedGitRevision: (rev: GitMetadata) => void;
  /** Clear the Git revisions array */
  clearPinnedGitRevisions: () => void;
  /** The current Git status of the repository */
  gitStatus: GitStatus | null;
  /** The Git status of the repository before the checkout*/
  prevGitStatus: GitStatus | null;
  /** Checkout a git revision, save back the current state */
  checkoutGitRevision: (rev: string) => Promise<void>;
  /** Restore the original git status before a checkout */
  restoreGitStatus: () => Promise<void>;

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
  closeCurrentFlow: () => void;
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
  /** Reset the store to its initial state */
  reset: () => void;
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
  /** Whether the Git Dialog should be displayed */
  isGitDialogOpen: boolean;
  /**
   * Set {@link isGitDialogOpen}
   * @param isOpen - Whether the dialog should be opened or closed
   */
  setIsGitDialogOpen: (isOpen: boolean) => void;
}
