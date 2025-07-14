import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
} from "@xyflow/react";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { client } from "./client";
import { isStatusNode, type AppNode, type AppNodeType } from "./types/nodes";
import { type AppState, type UiState } from "./types/state";

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
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
        const store = get();
        await store.saveCurrentFlow();
        set({ currentFlow: null });
        store.setNodes([]);
        store.setEdges([]);
      },
      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
          hasUnsavedChanges: true,
        });
      },
      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
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
        console.log("onConnectEnd called");
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
