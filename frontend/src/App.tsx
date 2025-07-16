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
import { useRef, useState } from "react";
import { HotkeysProvider, useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { AppMenubar } from "./components/app-menubar";
import { CreateNodeDialog } from "./components/create-node-dialog";
import { EditNodeDialog } from "./components/edit-node-dialog";
import { GitGraphSlidingPanel } from "./components/git-graph-sliding-panel";
import { GitRevisionsPanel } from "./components/git-revisions-panel";
import { HelpDialog, KeybindingsDialog } from "./components/help-dialog";
import { ActionNode, StatusNode } from "./components/nodes";
import { Toaster } from "./components/ui/sonner";
import { keybindings } from "./keybindings";
import { useStore, useUiStore } from "./store";
import type { AppNode } from "./types/nodes";
import type { AppState, UiState } from "./types/state";

const nodeTypes = {
  actionNode: ActionNode,
  statusNode: StatusNode,
} as const;

const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  onConnectEnd: state.onConnectEnd,
  saveCurrentFlow: state.saveCurrentFlow,
  setCurrentEditNodeData: state.setCurrentEditNodeData,
  clearGitRevisions: state.clearGitRevisions,
});

const uiStoreSelector = (state: UiState) => ({
  isMiniMapVisible: state.isMiniMapVisible,
  setIsMiniMapVisible: state.setIsMiniMapVisible,
  setIsFlowsDialogOpen: state.setIsFlowsDialogOpen,
  setIsHelpDialogOpen: state.setIsHelpDialogOpen,
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
    onConnectEnd,
    saveCurrentFlow,
    setCurrentEditNodeData,
    clearGitRevisions,
  } = useStore(useShallow(selector));

  const reactFlowRef = useRef<HTMLDivElement>(null); // Ref for the ReactFlow component itself
  const { theme } = useTheme();

  const { isMiniMapVisible, setIsFlowsDialogOpen } = useUiStore(
    useShallow(uiStoreSelector),
  );

  useHotkeys(
    keybindings.save.keys,
    (e) => {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      saveCurrentFlow();
    },
    {
      description: keybindings.save.description,
    },
  );

  useHotkeys(
    keybindings.open.keys,
    (e) => {
      e.preventDefault();
      setIsFlowsDialogOpen(true);
    },
    {
      description: keybindings.open.description,
    },
  );

  const [isGitGraphPanelOpen, setIsGitGraphPanelOpen] = useState(false);
  return (
    <HotkeysProvider>
      <div style={{ width: "100vw", height: "100vh" }}>
        <GitGraphSlidingPanel
          isOpen={isGitGraphPanelOpen}
          onClose={() => {
            clearGitRevisions();
            setIsGitGraphPanelOpen(false);
          }}
        ></GitGraphSlidingPanel>
        <ReactFlow
          ref={reactFlowRef}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onNodeDoubleClick={(_e, node: AppNode) => {
            // typescript is stupid
            if (node.type === "statusNode") {
              setCurrentEditNodeData({
                id: node.id,
                type: node.type,
                data: node.data,
              });
            } else {
              setCurrentEditNodeData({
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
          {isMiniMapVisible && <MiniMap position="top-right" />}
          <Background />
          <HelpDialog />
          <KeybindingsDialog />
          <EditNodeDialog />
          <CreateNodeDialog />
          <GitRevisionsPanel
            openGitGraph={() => {
              setIsGitGraphPanelOpen(true);
            }}
          />
        </ReactFlow>
        <Toaster position="bottom-right" richColors />
      </div>
    </HotkeysProvider>
  );
}
