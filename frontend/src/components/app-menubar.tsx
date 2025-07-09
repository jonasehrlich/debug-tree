import { ProjectDialog } from "@/components/project-dialog";
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
import type { ActionNode, AppNode, StatusNode } from "@/types/nodes";
import type { AppState, UiState } from "@/types/state";
import {
  useReactFlow,
  useStore as useReactFlowStore,
  useStoreApi as useReactFlowStoreApi,
  type ReactFlowState,
} from "@xyflow/react";
import { LineChart, Plus, Rocket, Workflow } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";
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

const projectSelector = (s: AppState) => ({
  currentProject: s.currentProject,
  saveOngoing: s.saveOngoing,
  hasUnsavedChanges: s.hasUnsavedChanges,
  closeCurrentProject: s.closeCurrentProject,
  saveCurrentProject: s.saveCurrentProject,
  currentEdgeType:
    s.edges.length > 0 && s.edges[0].type ? s.edges[0].type : "bezier",
  setEdgeType: s.setEdgeType,
});

const uiStoreSelector = (s: UiState) => ({
  isMiniMapVisible: s.isMiniMapVisible,
  setIsMiniMapVisible: s.setIsMiniMapVisible,
  setIsProjectDialogOpen: s.setIsProjectDialogOpen,
});

export const AppMenubar = ({ reactflowRef }: AppMenubarProps) => {
  const {
    saveOngoing,
    currentProject,
    hasUnsavedChanges,
    closeCurrentProject,
    saveCurrentProject,
    currentEdgeType,
    setEdgeType,
  } = useStore(useShallow(projectSelector));
  const { isMiniMapVisible, setIsMiniMapVisible, setIsProjectDialogOpen } =
    useUiStore(useShallow(uiStoreSelector));
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };
  const { isInteractive, minZoomReached, maxZoomReached } = useReactFlowStore(
    useShallow(reactflowSelector),
  );
  const { addNodes, screenToFlowPosition, zoomIn, zoomOut, fitView } =
    useReactFlow<AppNode>();

  const reactflowStore = useReactFlowStoreApi();
  const onSetIsInteractiveHandler = (isInteractive: boolean) => {
    reactflowStore.setState({
      nodesDraggable: isInteractive,
      nodesConnectable: isInteractive,
      elementsSelectable: isInteractive,
    });
  };

  const createNode = useCallback(
    (type: "actionNode" | "statusNode") => {
      if (
        !reactflowRef ||
        typeof reactflowRef !== "object" ||
        !("current" in reactflowRef) ||
        !reactflowRef.current
      )
        return;

      const bounds = reactflowRef.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      });

      if (type === "actionNode") {
        const newNode: ActionNode = {
          id: `action-node-${crypto.randomUUID()}`,
          type: "actionNode",
          position,
          data: {
            title: "Action Node",
            description: "A new action node",
          },
        };
        addNodes(newNode);
      } else {
        const newNode: StatusNode = {
          id: `status-node-${crypto.randomUUID()}`,
          type: "statusNode",
          position,
          data: {
            title: "Status Node",
            description: "A new status node",
            state: "unknown",
            git: {
              rev: "",
            },
          },
        };
        addNodes(newNode);
      }
    },
    [addNodes, reactflowRef, screenToFlowPosition],
  );

  const menubarIconSize = 15;
  const menubarLeftIconProps = {
    size: menubarIconSize,
    className: "mr-2",
  };
  const menubarRightIconProps = {
    size: menubarIconSize,
    className: "ml-2",
  };
  return (
    <Menubar>
      <MenubarMenu>
        <ProjectDialog
          children={
            <MenubarTrigger>
              <Workflow {...menubarLeftIconProps} />{" "}
              {currentProject ? currentProject.name : "Project"}
            </MenubarTrigger>
          }
        ></ProjectDialog>
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
              setIsProjectDialogOpen(true);
            }}
          >
            Open / Create Project
            <MenubarShortcut>{keybindings.open.repr}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              saveCurrentProject();
            }}
          >
            Save
            <MenubarShortcut>{keybindings.save.repr}</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSelect={closeCurrentProject}
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
      {/* TODO: Fix behavior of these two buttons, or figure out another UI paradigm*/}
      <MenubarMenu>
        <MenubarTrigger
          onClick={() => {
            createNode("actionNode");
          }}
          disabled={saveOngoing || !currentProject}
        >
          <Plus {...menubarLeftIconProps} /> Action Node{" "}
          <Rocket {...menubarRightIconProps} />
        </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger
          onClick={() => {
            createNode("statusNode");
          }}
          disabled={saveOngoing || !currentProject}
        >
          <Plus {...menubarLeftIconProps} /> Status Node{" "}
          <LineChart {...menubarRightIconProps} />
        </MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  );
};
