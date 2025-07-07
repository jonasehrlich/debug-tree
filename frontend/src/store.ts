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
import type {
  ActionNodeData,
  AppNode,
  StatusNode,
  StatusNodeData,
} from "./types/nodes";
import { type AppState, type EditNodeData, type UiState } from "./types/state";

function isStatusNode(node: AppNode): node is StatusNode {
  return node.type == "statusNode";
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      currentProject: null,
      projects: [],
      hasUnsavedChanges: false,
      saveOngoing: false,
      editNodeData: null,
      gitRevisions: [],
      addGitRevision(rev) {
        let revs = get().gitRevisions;
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
      createProject: async (name: string) => {
        console.log(`Creating project ${name}`);
        const { data, error } = await client.POST("/api/v1/projects", {
          body: { name: name },
        });
        if (data) {
          // TODO: If current project is set, save it first. Or maybe save every time this dialog is opened
          set({ currentProject: data.project });
          const store = get();

          store.setNodes([]);
          store.setEdges([]);
          toast.success(`Created Project ${data.project.name}`);
          // setOpen(false);
        } else {
          // TODO: set the error instead
          toast.error(`Error creating project ${name}`, {
            description: error.message,
          });
        }
      },
      deleteProject: async (id: string) => {
        const { data, error } = await client.DELETE("/api/v1/projects/{id}", {
          params: { path: { id } },
        });

        if (data) {
          await get().loadProjectsMetadata();
        }
        if (error) {
          toast.error(`Error deleting project ${id}`, {
            description: error.message,
          });
        }
      },
      loadProjectsMetadata: async () => {
        const { data, error } = await client.GET("/api/v1/projects");
        if (error) {
          toast.error("Error loading projects", { description: error.message });
        }
        if (data) {
          set({
            projects: data.projects,
          });
        }
      },
      loadProject: async (id: string) => {
        const { data, error } = await client.GET("/api/v1/projects/{id}", {
          params: { path: { id: id } },
        });
        if (error) {
          toast.error("Error loading project", { description: error.message });
        }
        if (data) {
          // The project has been loaded successfully, first set the metadata of the project that is currently loaded
          set({
            currentProject: { id: id, name: data.project.name },
          });

          const store = get();
          store.setNodes(data.project.reactflow.nodes as AppNode[]);
          store.setEdges(data.project.reactflow.edges as Edge[]);
        }
      },
      saveCurrentProject: async () => {
        const store = get();
        if (!store.currentProject) {
          return;
        }
        if (!store.hasUnsavedChanges) {
          return;
        }
        set({ saveOngoing: true });

        const { error } = await client.POST("/api/v1/projects/{id}", {
          params: {
            path: { id: store.currentProject.id },
          },
          body: {
            project: {
              name: store.currentProject.name,
              reactflow: { nodes: store.nodes, edges: store.edges },
            },
          },
        });
        if (error) {
          toast.error(`Saving project ${store.currentProject.name} failed`, {
            description: error.message,
          });
        } else {
          toast.success("Saved", { duration: 800 });
          set({ hasUnsavedChanges: false });
        }
        set({ saveOngoing: false });
      },
      closeCurrentProject: async () => {
        const store = get();
        await store.saveCurrentProject();
        set({ currentProject: null });
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
      setNodes: (nodes) => {
        set({ nodes });
      },
      setEdges: (edges) => {
        set({ edges });
      },
      updateStatusNodeState: (nodeId, state) => {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === nodeId && isStatusNode(node)) {
              // it's important to create a new object here, to inform React Flow about the changes
              return { ...node, data: { ...node.data, state } };
            }

            return node;
          }),
        });
      },
      getNodeById: (nodeId) => {
        get().nodes.map((node) => {
          if (node.id === nodeId) {
            return node;
          }
        });
        return null;
      },
      editNode: (
        data:
          | EditNodeData<"actionNode", ActionNodeData>
          | EditNodeData<"statusNode", StatusNodeData>,
      ) => {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === data.id) {
              // typescript is stupid
              if (node.type === "statusNode" && data.type === "statusNode") {
                // it's important to create a new object here, to inform React Flow about the changes
                return { ...node, data: data.data };
              } else if (
                node.type === "actionNode" &&
                data.type === "actionNode"
              ) {
                return { ...node, data: data.data };
              }
            }

            return node;
          }),
        });
        set({ editNodeData: null });
      },
      setEditNodeData: (data) => {
        set({ editNodeData: data });
      },
    }),
    {
      name: "debug-tree-flow-storage",
    },
  ),
);

export const useUiStore = create<UiState>()(
  persist(
    // @ts-expect-error: Keep for now, get will be required later
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (set, get) => ({
      isProjectDialogOpen: false,
      isMiniMapVisible: true,
      setIsMiniMapVisible: (isVisible) => {
        set({ isMiniMapVisible: isVisible });
      },
      setIsProjectDialogOpen(isOpen) {
        set({ isProjectDialogOpen: isOpen });
      },
    }),
    {
      name: "debug-tree-ui-storage",
    },
  ),
);
