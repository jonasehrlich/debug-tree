import {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  ReactFlow,
  type ColorModeClass,
  type FitViewOptions,
  type OnNodeDrag,
} from "@xyflow/react";
import { Sun, Moon, Map } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ActionNode, StatusNode } from "./components/nodes";
import { Toaster } from "./components/ui/sonner";
import useStore from "./store";
import "@xyflow/react/dist/style.css";
import type { AppState } from "./types/state";
import { AppControlPanel } from "./components/app-control-panel";

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

  const [colorMode, setColorMode] = useState<ColorModeClass>(() => {
    if (typeof window !== "undefined") {
      // Check if window is defined (for SSR safety)
      // Check the local storage for a theme
      const storedTheme = localStorage.getItem("app-theme") as
        | ColorModeClass
        | undefined;
      // Get the theme that matches the system theme
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : ("light" as ColorModeClass);
      // If no theme is stored, use the system theme
      return storedTheme ?? systemTheme;
    }

    return "light"; // Default for SSR or if window is not available
  });
  useEffect(() => {
    localStorage.setItem("app-theme", colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    const newTheme = colorMode === "light" ? "dark" : "light";
    setColorMode(newTheme);
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
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        colorMode={colorMode}
        fitView
        fitViewOptions={fitViewOptions}
      >
        <AppControlPanel position="top-left"/>
        {isMiniMapVisible && <MiniMap position="top-right" />}
        <Background />
        <Controls>
          <ControlButton onClick={toggleColorMode}>
            {colorMode === "dark" ? <Sun /> : <Moon />}
          </ControlButton>
          <ControlButton onClick={toggleMiniMap}>
            <Map />
          </ControlButton>
        </Controls>
      </ReactFlow>
      <Toaster
        position="bottom-right"
        richColors
        theme={colorMode}
      />
    </div>
  );
}
