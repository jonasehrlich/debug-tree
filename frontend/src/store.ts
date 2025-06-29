import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
} from "@xyflow/react";
import { toast } from "sonner";
import { create } from "zustand";
import { client } from "./client";
import type { AppNode, StatusNode } from "./types/nodes";
import { type AppState } from "./types/state";

function isStatusNode(node: AppNode): node is StatusNode {
  return node.type == "statusNode";
}

const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  currentProject: null,
  projects: [],
  error: null,
  hasUnsavedChanges: false,
  saveOngoing: false,
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
  loadProjectsMetadata: async () => {
    const { data, error } = await client.GET("/api/v1/projects");
    if (error) {
      set({
        error: { message: "Loading projects failed", response: error },
      });
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
      set({
        error: { message: "Loading project {id} failed", response: error },
      });
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
      toast.success("Saved");
      set({ hasUnsavedChanges: false });
    }
    set({ saveOngoing: false });
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
}));

export default useStore;
