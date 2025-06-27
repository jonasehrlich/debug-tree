import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
} from "@xyflow/react";
import { create } from "zustand";
import type { AppNode, StatusNode } from "./types/nodes";
import { type AppState } from "./types/state";

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

const useStore = create<AppState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
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
