import {
  Background,
  ControlButton,
  Controls,
  MiniMap,
  ReactFlow,
  type ColorMode,
  type FitViewOptions,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Map, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { AppControlPanel } from "./components/app-control-panel";
import { EditNodeDialog } from "./components/edit-node-dialog";
import { ActionNode, StatusNode } from "./components/nodes";
import { Toaster } from "./components/ui/sonner";
import useStore from "./store";
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
  padding: 0.2,
};

const onNodeDrag: OnNodeDrag = (_, node) => {
  console.log("drag event", node.data);
};

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore(
    useShallow(selector),
  );

  const reactFlowRef = useRef<HTMLDivElement>(null); // Ref for the ReactFlow component itself
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const [isMiniMapVisible, setIsMiniMapVisible] = useState<boolean>(() => {
    return localStorage.getItem("app-minimap-visible") === "false"
      ? false
      : true;
  });
  useEffect(() => {
    localStorage.setItem("app-minimap-visible", String(isMiniMapVisible));
  }, [isMiniMapVisible]);

  const toggleMiniMap = () => {
    setIsMiniMapVisible(!isMiniMapVisible);
  };

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
        <AppControlPanel position="top-left" ref={reactFlowRef} />
        {isMiniMapVisible && <MiniMap position="top-right" />}
        <Background />
        <Controls>
          <ControlButton onClick={toggleTheme}>
            <Sun className="hidden dark:block" />
            <Moon className="block dark:hidden" />
          </ControlButton>
          <ControlButton onClick={toggleMiniMap}>
            <Map />
          </ControlButton>
        </Controls>
        <EditNodeDialog />
      </ReactFlow>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
