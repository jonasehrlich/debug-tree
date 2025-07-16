import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { client } from "./client";
import { isStatusNode, type AppNode, type AppNodeType } from "./types/nodes";
import { type AppState, type UiState } from "./types/state";

/**
 * Whether the state before a set of {@link NodeChange}s should be added to the undo stack
 * @param changes - Array of changes passed to {@link AppState.onNodesChange}
 * @param nodes - Nodes existing before the changes are applied
 * @returns Whether the changes should be added to the undo stack
 */
const shouldObserveNodeChangesForUndo = (
  changes: NodeChange<AppNode>[],
  nodes: AppNode[],
) => {
  if (nodes.length === 0) {
    /// Don't allow undoing creation of the initial node
    return false;
  }

  return changes.some((change) => {
    return (
      change.type === "remove" ||
      change.type === "add" ||
      change.type === "replace"
    );
  });
};

const shouldSaveEdgeChanges = (
  changes: EdgeChange<Edge>[],
  nodes: AppNode[],
) => {
  if (nodes.length === 0) {
    return false;
  }

  return changes.some((change) => {
    return change.type !== "select";
  });
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      undoStack: [],
      undoInProgress: false,
      undo() {
        const { undoStack, redoStack, nodes, edges } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        // TODO: logging
        // console.log(prev.nodes[0]);
        set({ undoInProgress: true });
        set({
          ...prev,
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, { nodes, edges }],
        });
        set({ undoInProgress: false });
      },
      pushToUndoStack() {
        const { nodes, edges, undoStack } = get();
        // TODO: logging
        // console.log("push to undo stack", undoStack);
        const newUndoStack = [...undoStack, { nodes, edges }];
        set({ undoStack: newUndoStack, redoStack: [] });
      },
      redoStack: [],
      redo() {
        const { undoStack, redoStack, nodes, edges } = get();
        if (redoStack.length === 0) return;

        const next = redoStack[redoStack.length - 1];
        set({
          ...next,
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack, { nodes, edges }],
        });
      },
      currentFlow: null,
      flows: [],
      hasUnsavedChanges: false,
      currentEditNodeData: null,
      pendingNodeData: null,
      setPendingNodeData(nodeData) {
        set({ pendingNodeData: nodeData });
      },
      gitRevisions: [],
      addGitRevision(rev) {
        const revs = get().gitRevisions;
        if (revs.length == 2) {
          revs[1] = rev;
        } else {
          revs.push(rev);
        }
        set({ gitRevisions: revs });
      },
      clearGitRevisions() {
        set({ gitRevisions: [] });
      },
      createFlow: async (name: string) => {
        const { data, error } = await client.POST("/api/v1/flows", {
          body: { name: name },
        });
        if (data) {
          // TODO: If current flow is set, save it first. Or maybe save every time this dialog is opened
          set({ currentFlow: data.flow });

          const store = get();
          store.setNodes([]);
          store.setEdges([]);
          toast.success(`Created Flow ${data.flow.name}`);
          return true;
        }
        toast.error(`Error creating flow ${name}`, {
          description: error.message,
        });
        return false;
      },
      deleteFlow: async (id: string) => {
        const { data, error } = await client.DELETE("/api/v1/flows/{id}", {
          params: { path: { id } },
        });

        if (data) {
          await get().loadFlowsMetadata();
        }
        if (error) {
          toast.error(`Error deleting flow ${id}`, {
            description: error.message,
          });
        }
      },
      loadFlowsMetadata: async () => {
        const { data, error } = await client.GET("/api/v1/flows");
        if (error) {
          toast.error("Error loading flows", { description: error.message });
        }
        if (data) {
          set({
            flows: data.flows,
          });
        }
      },
      loadFlow: async (id: string) => {
        const { data, error } = await client.GET("/api/v1/flows/{id}", {
          params: { path: { id: id } },
        });
        if (error) {
          toast.error("Error loading flow", { description: error.message });
        }
        if (data) {
          // The flow has been loaded successfully, first set the metadata of the flow that is currently loaded
          set({
            currentFlow: { id: id, name: data.flow.name },
          });

          const store = get();
          store.setNodes(data.flow.reactflow.nodes as AppNode[]);
          store.setEdges(data.flow.reactflow.edges as Edge[]);
        }
      },
      saveCurrentFlow: async () => {
        const store = get();
        if (!store.currentFlow) {
          return;
        }
        if (!store.hasUnsavedChanges) {
          return;
        }

        const { error } = await client.POST("/api/v1/flows/{id}", {
          params: {
            path: { id: store.currentFlow.id },
          },
          body: {
            flow: {
              name: store.currentFlow.name,
              reactflow: { nodes: store.nodes, edges: store.edges },
            },
          },
        });
        if (error) {
          toast.error(`Saving flow ${store.currentFlow.name} failed`, {
            description: error.message,
          });
        } else {
          toast.success("Saved", { duration: 800 });
          set({ hasUnsavedChanges: false });
        }
      },
      closeCurrentFlow: async () => {
        const { saveCurrentFlow } = get();
        await saveCurrentFlow();
        set({
          nodes: [],
          edges: [],
          currentFlow: null,
          undoStack: [],
          redoStack: [],
        });
      },
      onNodesChange: (changes) => {
        const { nodes, undoInProgress, pushToUndoStack } = get();
        if (
          !undoInProgress &&
          shouldObserveNodeChangesForUndo(changes, nodes)
        ) {
          pushToUndoStack();
        }
        const newNodes = applyNodeChanges(changes, nodes);

        set({
          nodes: newNodes,
          hasUnsavedChanges: true,
        });
      },
      onEdgesChange: (changes) => {
        const { edges, nodes, undoStack } = get();
        if (shouldSaveEdgeChanges(changes, nodes)) {
          set({
            undoStack: [...undoStack, { nodes, edges }],
            redoStack: [],
          });
        }

        set({
          edges: applyEdgeChanges(changes, edges),
          hasUnsavedChanges: true,
        });
      },
      onConnect: (connection) => {
        set({
          edges: addEdge(connection, get().edges),
          hasUnsavedChanges: true,
        });
      },
      onConnectEnd: (event, connectionState) => {
        const connectedToAnotherNode = connectionState.isValid;
        if (connectedToAnotherNode) {
          return;
        }
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const fromNode = connectionState.fromNode;
        if (fromNode === null) {
          return;
        }
        const nodeType: AppNodeType = isStatusNode(fromNode)
          ? "actionNode"
          : "statusNode";

        get().setPendingNodeData({
          eventScreenPosition: { x: clientX, y: clientY },
          type: nodeType,
          fromNodeId: fromNode.id,
        });
      },
      setEdgeType: (newType) => {
        set((state) => ({
          edges: state.edges.map((edge) => ({
            ...edge,
            type: newType,
          })),
        }));
      },
      setNodes: (nodes) => {
        set({ nodes });
      },
      setEdges: (edges) => {
        set({ edges });
      },
      setCurrentEditNodeData: (data) => {
        set({ currentEditNodeData: data });
      },
    }),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        currentFlow: state.currentFlow,
        hasUnsavedChanges: state.hasUnsavedChanges,
        pendingNodeData: state.pendingNodeData,
      }),
      name: "debug-flow-flow-storage",
    },
  ),
);

export const useUiStore = create<UiState>()(
  persist(
    // @ts-expect-error: Keep for now, get will be required later
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (set, get) => ({
      isMiniMapVisible: true,
      setIsMiniMapVisible: (isVisible) => {
        set({ isMiniMapVisible: isVisible });
      },
      isFlowsDialogOpen: false,
      setIsFlowsDialogOpen(isOpen) {
        set({ isFlowsDialogOpen: isOpen });
      },
      isInlineDiff: false,
      setIsInlineDiff(isInlineDiff) {
        set({ isInlineDiff: isInlineDiff });
      },
      isHelpDialogOpen: false,
      setIsHelpDialogOpen(isOpen) {
        set({ isHelpDialogOpen: isOpen });
      },
      isKeybindingsDialogOpen: false,
      setIsKeybindingsDialogOpen(isOpen) {
        set({ isKeybindingsDialogOpen: isOpen });
      },
    }),
    {
      name: "debug-flow-ui-storage",
    },
  ),
);
