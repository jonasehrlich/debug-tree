import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  type ColorMode,
  type FitViewOptions,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { AppMenubar } from "./components/app-menubar";
import { EditNodeDialog } from "./components/edit-node-dialog";
import { ActionNode, StatusNode } from "./components/nodes";
import { Toaster } from "./components/ui/sonner";
import { useStore, useUiStore } from "./store";
import type { AppState } from "./types/state";

const nodeTypes = {
  actionNode: ActionNode,
  statusNode: StatusNode,
};

const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

const fitViewOptions: FitViewOptions = {
  // padding: 0.2,
};

const onNodeDrag: OnNodeDrag = (_, node) => {
  console.log("drag event", node.data);
};

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore(
    useShallow(selector),
  );

  const reactFlowRef = useRef<HTMLDivElement>(null); // Ref for the ReactFlow component itself
  const { theme } = useTheme();

  const isMiniMapVisible = useUiStore((state) => state.isMiniMapVisible);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        ref={reactFlowRef}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        colorMode={theme ? (theme as ColorMode) : "system"}
        fitView
        fitViewOptions={fitViewOptions}
      >
        <Panel position="top-left" ref={reactFlowRef}>
          <AppMenubar reactflowRef={reactFlowRef} />
        </Panel>
        {/* <AppControlPanel position="top-left" ref={reactFlowRef} /> */}
        {isMiniMapVisible && <MiniMap position="top-right" />}
        <Background />
        <EditNodeDialog />
      </ReactFlow>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
