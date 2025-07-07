import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  type ColorMode,
  type FitViewOptions,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { HotkeysProvider, useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { AppMenubar } from "./components/app-menubar";
import { EditNodeDialog } from "./components/edit-node-dialog";
import { ActionNode, StatusNode } from "./components/nodes";
import { Toaster } from "./components/ui/sonner";
import { keybindings } from "./keybindings";
import { useStore, useUiStore } from "./store";
import type { AppNode } from "./types/nodes";
import type { AppState, UiState } from "./types/state";

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
  saveCurrentProject: state.saveCurrentProject,
  setEditNodeData: state.setEditNodeData,
});

const uiStoreSelector = (state: UiState) => ({
  isMiniMapVisible: state.isMiniMapVisible,
  setIsMiniMapVisible: state.setIsMiniMapVisible,
  setIsProjectDialogOpen: state.setIsProjectDialogOpen,
});

const fitViewOptions: FitViewOptions = {
  // padding: 0.2,
};

export default function App() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    saveCurrentProject,
    setEditNodeData,
  } = useStore(useShallow(selector));

  const reactFlowRef = useRef<HTMLDivElement>(null); // Ref for the ReactFlow component itself
  const { theme } = useTheme();

  const { isMiniMapVisible, setIsProjectDialogOpen } = useUiStore(
    useShallow(uiStoreSelector),
  );

  useHotkeys(
    keybindings.save.keys,
    (e) => {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      saveCurrentProject();
    },
    {
      description: keybindings.save.description,
    },
  );

  useHotkeys(
    keybindings.open.keys,
    (e) => {
      e.preventDefault();
      setIsProjectDialogOpen(true);
    },
    {
      description: keybindings.open.description,
    },
  );

  return (
    <HotkeysProvider>
      <div style={{ width: "100vw", height: "100vh" }}>
        <ReactFlow
          ref={reactFlowRef}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={(_e, node: AppNode) => {
            // typescript is stupid
            if (node.type === "statusNode") {
              // it's important to create a new object here, to inform React Flow about the changes
              setEditNodeData({
                id: node.id,
                type: node.type,
                data: node.data,
              });
            } else if (node.type === "actionNode") {
              setEditNodeData({
                id: node.id,
                type: node.type,
                data: node.data,
              });
            }
          }}
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
    </HotkeysProvider>
  );
}
