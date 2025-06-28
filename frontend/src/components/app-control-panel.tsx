import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import useStore from "@/store";
import { Panel, type PanelProps } from "@xyflow/react";
import {
  FilePlus2,
  FolderOpen,
  LineChart,
  Plus,
  Redo2,
  Rocket,
  Save,
  Undo2,
} from "lucide-react";
import { forwardRef } from "react";
import { toast } from "sonner";
import { CreateProjectDialog } from "./create-project-dialog";
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

export const AppControlPanel: React.FC<AppControlPanelProps> = ({
  buttonShape = "default",
  ...props
}) => {
  const onUnsupportedFeatClick = () => {
    toast.error("This feature is not supported yet");
  };

  const hasUnsavedChanges = useStore((state) => state.hasUnsavedChanges);
  const saveOngoing = useStore((state) => state.saveOngoing);

  return (
    <Panel {...props}>
      <CreateProjectDialog
        children={
          <AppControlPanelButton
            tooltipContent="Create New Project"
            leftIcon={<FilePlus2 />}
            shape={buttonShape}
          />
        }
      />
      <AppControlPanelButton
        tooltipContent="Open Project"
        leftIcon={<FolderOpen />}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />
      <AppControlPanelButton
        tooltipContent="Save Project"
        leftIcon={<Save />}
        hasNotification={hasUnsavedChanges}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
        disabled={saveOngoing}
      />
      <AppControlPanelButton
        tooltipContent="Undo"
        leftIcon={<Undo2 />}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />
      <AppControlPanelButton
        tooltipContent="Redo"
        leftIcon={<Redo2 />}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />

      <AppControlPanelButton
        tooltipContent="Create Action Node"
        leftIcon={<Plus strokeWidth="3" />}
        text="Create Action Node"
        rightIcon={<Rocket />}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />

      <AppControlPanelButton
        tooltipContent="Create Status Node"
        leftIcon={<Plus strokeWidth="3" />}
        text="Create Status Node"
        rightIcon={<LineChart />}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />
    </Panel>
  );
};
