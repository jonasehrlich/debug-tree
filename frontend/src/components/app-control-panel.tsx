import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Panel, type PanelProps } from "@xyflow/react";
import { FilePlus2, FolderOpen, Redo2, Save, Undo2 } from "lucide-react";
import { forwardRef } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import type { ButtonProps } from "./ui/button-props";
import { CreateProjectDialog } from "./create-project-dialog";

type ButtonShape = "round" | "default";

interface AppControlPanelButtonSpecificProps {
  icon: React.ReactElement;
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
      icon,
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
              "cursor-pointer w-12 h-12 p-0 relative shadow-lg mx-2",
              shape == "round" ? "rounded-full" : "",
            )}
            {...props}
          >
            {icon}
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

  return (
    <Panel {...props}>
      <CreateProjectDialog
        children={
          <AppControlPanelButton
            tooltipContent="Create New Project"
            icon={<FilePlus2 />}
            shape={buttonShape}
          />
        }
      />
      <AppControlPanelButton
        tooltipContent="Open Project"
        icon={<FolderOpen />}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />
      <AppControlPanelButton
        tooltipContent="Save Project"
        icon={<Save />}
        hasNotification={true}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />
      <AppControlPanelButton
        tooltipContent="Undo"
        icon={<Undo2 />}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />
      <AppControlPanelButton
        tooltipContent="Redo"
        icon={<Redo2 />}
        onClick={onUnsupportedFeatClick}
        shape={buttonShape}
      />
    </Panel>
  );
};
