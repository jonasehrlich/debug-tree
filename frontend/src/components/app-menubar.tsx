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
    s.edges.length > 0 && s.edges[0].type ? s.edges[0].type : "bezier",
  setEdgeType: s.setEdgeType,
});

const uiStoreSelector = (s: UiState) => ({
  isMiniMapVisible: s.isMiniMapVisible,
  setIsMiniMapVisible: s.setIsMiniMapVisible,
  setIsFlowDialogOpen: s.setIsFlowsDialogOpen,
});

export const AppMenubar = ({ reactflowRef }: AppMenubarProps) => {
  const {
    currentFlow,
    hasUnsavedChanges,
    closeCurrentFlow,
    saveCurrentFlow,
    currentEdgeType,
    setEdgeType,
  } = useStore(useShallow(flowSelector));
  const { isMiniMapVisible, setIsMiniMapVisible, setIsFlowDialogOpen } =
    useUiStore(useShallow(uiStoreSelector));
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
            <span
              className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4
                           h-3 w-3 rounded-full bg-pink-600
                           flex items-center justify-center text-white text-xs font-bold
                           border-2 border-background"
            ></span>
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
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSelect={closeCurrentFlow}
          >
            Close
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem disabled>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
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
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
