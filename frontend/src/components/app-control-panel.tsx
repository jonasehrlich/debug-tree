import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import useStore from "@/store";
import type { ActionNode, AppNode, StatusNode } from "@/types/nodes";
import { Panel, useReactFlow, type PanelProps } from "@xyflow/react";
import {
  LineChart,
  Plus,
  Redo2,
  Rocket,
  Save,
  Undo2,
  Workflow,
  X,
} from "lucide-react";
import { forwardRef, useCallback } from "react";
import { toast } from "sonner";
import { ProjectDialog } from "./project-dialog";
import { Button } from "./ui/button";
import type { ButtonProps } from "./ui/button-props";

type ButtonShape = "round" | "default";

interface AppControlPanelButtonSpecificProps {
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  text?: string;
  /** Whether the notification badge should be visible. */
  hasNotification?: boolean;
  tooltipContent: string;
  shape?: ButtonShape;
}

type AppControlPanelButtonProps = ButtonProps &
  AppControlPanelButtonSpecificProps;

const AppControlPanelButton = forwardRef<
  HTMLButtonElement,
  AppControlPanelButtonProps
>(
  (
    {
      className,
      leftIcon,
      text = "",
      rightIcon,
      tooltipContent,
      hasNotification,
      shape = "default",
      ...props
    },
    ref,
  ) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            className={cn(
              className,
              "cursor-pointer h-12 min-w-12 p-0 relative shadow-lg mx-2",
              shape == "round" ? "rounded-full" : "",
            )}
            {...props}
          >
            {leftIcon}
            {text}
            {rightIcon}
            {hasNotification && (
              <span
                className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4
                           h-4 w-4 rounded-full bg-pink-600
                           flex items-center justify-center text-white text-xs font-bold
                           border-2 border-background"
              >
                {" "}
                {/* Badge styling */}
                {/* Optional: You can put a count here, e.g., '3' */}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    );
  },
);

interface AppControlPanelSpecificProps {
  buttonShape?: ButtonShape;
}

type AppControlPanelProps = PanelProps & AppControlPanelSpecificProps;

export const AppControlPanel = forwardRef<HTMLDivElement, AppControlPanelProps>(
  ({ buttonShape = "default", ...props }, ref) => {
    const onUnsupportedFeatClick = () => {
      toast.error("This feature is not supported yet");
    };
    const { addNodes, screenToFlowPosition } = useReactFlow<AppNode>();

    const createNode = useCallback(
      (type: "actionNode" | "statusNode") => {
        if (
          !ref ||
          typeof ref !== "object" ||
          !("current" in ref) ||
          !ref.current
        )
          return;

        const bounds = ref.current.getBoundingClientRect();
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
      [addNodes, ref, screenToFlowPosition],
    );

    const hasUnsavedChanges = useStore((state) => state.hasUnsavedChanges);
    const saveOngoing = useStore((state) => state.saveOngoing);
    const currentProject = useStore((state) => state.currentProject);
    const saveCurrentProject = useStore((state) => state.saveCurrentProject);
    const closeCurrentProject = useStore((state) => state.closeCurrentProject);

    return (
      <Panel {...props}>
        <ProjectDialog
          children={
            <AppControlPanelButton
              tooltipContent="Manage Project"
              text={currentProject ? currentProject.name : "Project"}
              leftIcon={<Workflow strokeWidth="3" />}
              shape={buttonShape}
            />
          }
        />
        <AppControlPanelButton
          tooltipContent="Save"
          leftIcon={<Save strokeWidth="3" />}
          hasNotification={hasUnsavedChanges}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={saveCurrentProject}
          shape={buttonShape}
          disabled={saveOngoing || !currentProject}
        />
        <AppControlPanelButton
          tooltipContent="Undo"
          leftIcon={<Undo2 strokeWidth="3" />}
          onClick={onUnsupportedFeatClick}
          shape={buttonShape}
          disabled={saveOngoing || !currentProject}
        />
        <AppControlPanelButton
          tooltipContent="Redo"
          leftIcon={<Redo2 strokeWidth="3" />}
          onClick={onUnsupportedFeatClick}
          shape={buttonShape}
          disabled={saveOngoing || !currentProject}
        />
        <AppControlPanelButton
          tooltipContent="Close Project"
          leftIcon={<X strokeWidth="3" />}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={closeCurrentProject}
          shape={buttonShape}
          disabled={saveOngoing}
        />

        <AppControlPanelButton
          tooltipContent="Create Action Node"
          leftIcon={<Plus strokeWidth="3" />}
          text="Create Action Node"
          rightIcon={<Rocket />}
          onClick={() => {
            createNode("actionNode");
          }}
          shape={buttonShape}
          disabled={saveOngoing || !currentProject}
        />

        <AppControlPanelButton
          tooltipContent="Create Status Node"
          leftIcon={<Plus strokeWidth="3" />}
          text="Create Status Node"
          rightIcon={<LineChart strokeWidth="3" />}
          onClick={() => {
            createNode("statusNode");
          }}
          shape={buttonShape}
          disabled={saveOngoing || !currentProject}
        />
      </Panel>
    );
  },
);
