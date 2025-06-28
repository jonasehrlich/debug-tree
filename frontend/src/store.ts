import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
} from "@xyflow/react";
import { create } from "zustand";
import type { AppNode, StatusNode } from "./types/nodes";
import { type AppState } from "./types/state";
import { client } from "./client";

function isStatusNode(node: AppNode): node is StatusNode {
  return node.type == "statusNode";
}

const initialNodes: AppNode[] = [
  {
    id: "1",
    type: "actionNode",
    data: { title: "Node 1" },
    position: { x: 5, y: 5 },
  },
  {
    id: "2",
    type: "statusNode",
    data: {
      title: "Node 2",
      state: "unknown",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla ",
      git: {
        rev: "123asd",
      },
    },
    position: { x: 250, y: 5 },
  },
  {
    id: "3",
    type: "statusNode",
    data: { title: "Foo Bar", state: "unknown", description: "rockin'" },
    position: { x: 10, y: 200 },
  },
];

const initialEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

export interface ReactflowZustand {
  nodes: AppNode[];
  edges: Edge[];
}

const useStore = create<AppState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  currentProject: undefined,
  projects: [],
  error: undefined,
  hasUnsavedChanges: false,
  saveOngoing: false,
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

      // Get the nodes and edges from
      let nodes: AppNode[] = [];
      let edges: Edge[] = [];
      if (data.project.zustand) {
        const s = data.project.zustand as ReactflowZustand;
        nodes = s.nodes;
        edges = s.edges;
      }
      const store = get();
      store.setNodes(nodes);
      store.setEdges(edges);
    }
  },
  saveProject: async (id: string) => {
    set({ saveOngoing: true });
    const store = get();

    // if (!store.hasUnsavedChanges) {
    //   return;
    // }

    if (store.currentProject == undefined) {
      set({
        error: {
          message: "Cannot save a project if no current project is selected",
        },
      });
      return;
    }

    const { error } = await client.POST("/api/v1/projects/{id}", {
      params: {
        path: { id: id },
      },
      body: {
        project: {
          name: store.currentProject.name,
          zustand: { nodes: store.nodes, edges: store.edges },
        },
      },
    });
    if (error) {
      set({
        error: { message: "Saving project {id} failed", response: error },
      });
    } else {
      set({ hasUnsavedChanges: false });
    }
    set({ saveOngoing: true });
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
