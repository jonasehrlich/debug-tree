import { FlowsDialog } from "@/components/flows-dialog";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { keybindings } from "@/keybindings";
import { capitalize } from "@/lib/utils";
import { useStore, useUiStore } from "@/store";
import { edgeTypes, type EdgeType } from "@/types/edge";
import type { AppNode } from "@/types/nodes";
import type { AppState, UiState } from "@/types/state";
import {
  useReactFlow,
  useStore as useReactFlowStore,
  useStoreApi as useReactFlowStoreApi,
  type ReactFlowState,
} from "@xyflow/react";
import { Workflow } from "lucide-react";
import { useTheme } from "next-themes";
import { useShallow } from "zustand/react/shallow";
import { notify } from "../lib/notify";

interface AppMenubarProps {
  /// Ref to the reactflow component
  reactflowRef: React.Ref<HTMLDivElement>;
}

const reactflowSelector = (s: ReactFlowState) => ({
  isInteractive: s.nodesDraggable || s.nodesConnectable || s.elementsSelectable,
  minZoomReached: s.transform[2] <= s.minZoom,
  maxZoomReached: s.transform[2] >= s.maxZoom,
});

const flowSelector = (s: AppState) => ({
  currentFlow: s.currentFlow,
  hasUnsavedChanges: s.hasUnsavedChanges,
  closeCurrentFlow: s.closeCurrentFlow,
  saveCurrentFlow: s.saveCurrentFlow,
  currentEdgeType:
    s.edges.length > 0 && s.edges[0].type ? s.edges[0].type : "default",
  setEdgeType: s.setEdgeType,
  undo: s.undo,
  canUndo: s.undoStack.length > 0,
  redo: s.redo,
  canRedo: s.redoStack.length > 0,
});

const uiStoreSelector = (s: UiState) => ({
  isMiniMapVisible: s.isMiniMapVisible,
  setIsMiniMapVisible: s.setIsMiniMapVisible,
  setIsFlowDialogOpen: s.setIsFlowsDialogOpen,
  setIsHelpDialogOpen: s.setIsHelpDialogOpen,
  setIsKeybindingsDialogOpen: s.setIsKeybindingsDialogOpen,
});

export const AppMenubar = ({ reactflowRef }: AppMenubarProps) => {
  const {
    currentFlow,
    hasUnsavedChanges,
    closeCurrentFlow,
    saveCurrentFlow,
    currentEdgeType,
    setEdgeType,
    undo,
    canUndo,
    redo,
    canRedo,
  } = useStore(useShallow(flowSelector));
  const {
    isMiniMapVisible,
    setIsMiniMapVisible,
    setIsFlowDialogOpen,
    setIsHelpDialogOpen,
    setIsKeybindingsDialogOpen,
  } = useUiStore(useShallow(uiStoreSelector));
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };
  const { isInteractive, minZoomReached, maxZoomReached } = useReactFlowStore(
    useShallow(reactflowSelector),
  );
  const { zoomIn, zoomOut, fitView } = useReactFlow<AppNode>();

  const reactflowStore = useReactFlowStoreApi();
  const onSetIsInteractiveHandler = (isInteractive: boolean) => {
    reactflowStore.setState({
      nodesDraggable: isInteractive,
      nodesConnectable: isInteractive,
      elementsSelectable: isInteractive,
    });
  };

  const menubarIconSize = 15;
  const menubarLeftIconProps = {
    size: menubarIconSize,
    className: "mr-2",
  };
  return (
    <Menubar>
      <MenubarMenu>
        <FlowsDialog
          children={
            <MenubarTrigger>
              <Workflow {...menubarLeftIconProps} />{" "}
              {currentFlow ? currentFlow.name : "Flow"}
            </MenubarTrigger>
          }
          reactflowRef={reactflowRef}
        ></FlowsDialog>
      </MenubarMenu>
      <MenubarMenu>
        <div className="relative">
          <MenubarTrigger>File</MenubarTrigger>
          {hasUnsavedChanges && (
            <span className="border-background absolute top-0 right-0 flex h-3 w-3 translate-x-1/4 -translate-y-1/4 transform items-center justify-center rounded-full border-2 bg-pink-600 text-xs font-bold text-white"></span>
          )}
        </div>
        <MenubarContent>
          <MenubarItem
            onSelect={() => {
              setIsFlowDialogOpen(true);
            }}
          >
            Open / Create Flow
            <MenubarShortcut>{keybindings.open.repr}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              saveCurrentFlow();
            }}
          >
            Save
            <MenubarShortcut>{keybindings.save.repr}</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            onSelect={() => {
              saveCurrentFlow().then(closeCurrentFlow, () => {
                notify.error("Flow was not closed due to save error");
              });
            }}
          >
            Close
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={undo} disabled={!canUndo}>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={redo} disabled={!canRedo}>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem disabled>
            Cut <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Copy <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Paste <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem inset onSelect={toggleTheme}>
            Enable {theme === "light" ? "Dark" : "Light"} Mode
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem
            checked={isMiniMapVisible}
            onCheckedChange={setIsMiniMapVisible}
          >
            Show Minimap
          </MenubarCheckboxItem>
          <MenubarItem
            inset
            disabled={maxZoomReached}
            onSelect={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              zoomIn();
            }}
          >
            Zoom In
          </MenubarItem>
          <MenubarItem
            inset
            onSelect={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              zoomOut();
            }}
            disabled={minZoomReached}
          >
            Zoom Out
          </MenubarItem>
          <MenubarItem
            inset
            onSelect={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              fitView();
            }}
          >
            Fit View
          </MenubarItem>
          <MenubarCheckboxItem
            checked={isInteractive}
            onCheckedChange={onSetIsInteractiveHandler}
          >
            Interactive Mode
          </MenubarCheckboxItem>
          <MenubarSub>
            <MenubarSubTrigger inset>Edge Type</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarRadioGroup
                value={currentEdgeType}
                onValueChange={(type) => {
                  setEdgeType(type as EdgeType);
                }}
              >
                {edgeTypes.map((type) => (
                  <MenubarRadioItem key={type} value={type}>
                    {capitalize(type)}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onSelect={() => {
              setIsHelpDialogOpen(true);
            }}
          >
            Help
          </MenubarItem>
          <MenubarItem
            onSelect={() => {
              setIsKeybindingsDialogOpen(true);
            }}
          >
            Keybindings
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
