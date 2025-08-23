import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type ColorMode,
  type FitViewOptions,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import debounce from "lodash.debounce";
import { useTheme } from "next-themes";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { AppMenubar } from "./components/app-menubar";
import { CreateNodeDialog } from "./components/create-node-dialog";
import { EditNodeDialog } from "./components/edit-node-dialog";
import { GitDialog } from "./components/git-dialog";
import { GitRevisionsPanel } from "./components/git-revisions-panel";
import { HelpDialog, KeybindingsDialog } from "./components/help-dialog";
import { ActionNode, StatusNode } from "./components/nodes";
import { StatusBar } from "./components/status-bar";
import { Toaster } from "./components/ui/sonner";
import { keybindings } from "./keybindings";
import { isApple } from "./lib/utils";
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
  pushToUndoStack: state.pushToUndoStack,
  undo: state.undo,
  redo: state.redo,
  isEditOrCreateNodeDialogOpen: state.dialogNodeData !== null,
});

const uiStoreSelector = (state: UiState) => ({
  isMiniMapVisible: state.isMiniMapVisible,
  setIsMiniMapVisible: state.setIsMiniMapVisible,
  isFlowsDialogOpen: state.isFlowsDialogOpen,
  setIsFlowsDialogOpen: state.setIsFlowsDialogOpen,
  isHelpDialogOpen: state.isHelpDialogOpen,
  setIsHelpDialogOpen: state.setIsHelpDialogOpen,
  isKeybindingsDialogOpen: state.isKeybindingsDialogOpen,
});

const fitViewOptions: FitViewOptions = {
  // padding: 0.2,
};

export const App = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectEnd,
    saveCurrentFlow,
    setCurrentEditNodeData,
    pushToUndoStack,
    isEditOrCreateNodeDialogOpen,
    undo,
    redo,
  } = useStore(useShallow(selector));

  const reactFlowRef = React.useRef<HTMLDivElement>(null); // Ref for the ReactFlow component itself
  const { theme } = useTheme();
  const { getNodeConnections, getNode } = useReactFlow();

  const {
    isMiniMapVisible,
    isFlowsDialogOpen,
    setIsFlowsDialogOpen,
    isKeybindingsDialogOpen,
    isHelpDialogOpen,
  } = useUiStore(useShallow(uiStoreSelector));

  useHotkeys(
    keybindings.save.keys,
    () => {
      void saveCurrentFlow();
    },
    {
      description: keybindings.save.description,
      preventDefault: true,
    },
  );

  useHotkeys(
    keybindings.open.keys,
    () => {
      setIsFlowsDialogOpen(true);
    },
    {
      description: keybindings.open.description,
      preventDefault: true,
    },
  );
  const doPushToUndoStack = React.useCallback(pushToUndoStack, [
    pushToUndoStack,
  ]);

  // TODO: Check if these useHotkeys keyboard shortcuts work on Windows / Linux
  useHotkeys(
    keybindings.undo.keys,
    () => {
      console.log("undo");
      undo();
    },
    {
      description: keybindings.undo.description,
      preventDefault: true,
    },
  );

  useHotkeys(
    keybindings.redo.keys,
    () => {
      redo();
    },
    {
      description: keybindings.redo.description,
      preventDefault: true,
    },
  );

  // On macOS we have to implement the undo / redo handlers manually, see https://github.com/JohannesKlauss/react-hotkeys-hook/issues/1018
  React.useEffect(() => {
    const handleKeyDown = debounce((e: KeyboardEvent) => {
      // Check for both Ctrl and Command (Meta) keys
      const shouldHandle = !(
        isEditOrCreateNodeDialogOpen ||
        isFlowsDialogOpen ||
        isKeybindingsDialogOpen ||
        isHelpDialogOpen
      );
      if (!shouldHandle || !isApple) {
        return;
      }
      if (e.metaKey && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    }, 100);

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    undo,
    redo,
    isEditOrCreateNodeDialogOpen,
    isFlowsDialogOpen,
    isHelpDialogOpen,
    isKeybindingsDialogOpen,
  ]);

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
        onConnectEnd={onConnectEnd}
        onNodeDragStart={doPushToUndoStack}
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
        isValidConnection={(edgeOrConn) => {
          const hasNoTargetConnections =
            getNodeConnections({
              type: "target",
              nodeId: edgeOrConn.target,
            }).length === 0;
          const nodeTypesDiffer =
            getNode(edgeOrConn.source)?.type !==
            getNode(edgeOrConn.target)?.type;
          return hasNoTargetConnections && nodeTypesDiffer;
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
        <GitDialog />
        <GitRevisionsPanel />
        <Panel position="bottom-left">
          <StatusBar />
        </Panel>
      </ReactFlow>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "max-w-xs text-sm",
          duration: 1500,
        }}
        richColors
      />
    </div>
  );
};
