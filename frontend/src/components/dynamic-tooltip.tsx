import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Adjust path if needed
import React, { useCallback, useRef, useState } from "react";

/**
 * @interface DynamicTooltipProps
 * @description Props for the DynamicTooltip component.
 * @property {React.ReactNode} children - The element that triggers the tooltip (e.g., a button).
 * @property {() => Promise<boolean>} onClickAction - A function that is called when the trigger is clicked.
 * It should perform an action (e.g., copy to clipboard)
 * and return a Promise that resolves to `true` for success or `false` for failure.
 * @property {string} - The text to display when the tooltip is hovered normally.
 * @property {string} [successContent='Success'] - The text to display after a successful click action.
 * @property {string} [failedContent='Fail'] - The text to display after a failed click action.
 * @property {number} [successDisplayDurationMs=1000] - Total duration the success message is shown.
 * @property {number} [successTextResetPointMs=700] - Point in time (ms) at which success changes back to default text.
 * @property {number} [failDisplayDurationMs=2000] - Total duration the fail message is shown.
 */
interface DynamicTooltipProps {
  children: React.ReactNode;
  onClickAction: () => Promise<boolean>; // Returns true for success, false for failure
  defaultHoverContent: string;
  successContent?: string;
  failedContent?: string;
  successDisplayDurationMs?: number;
  successTextResetPointMs?: number;
  failDisplayDurationMs?: number;
}

/**
 * A tooltip that changes its value once the trigger was clicked
 */
export const DynamicTooltip: React.FC<DynamicTooltipProps> = ({
  children,
  onClickAction,
  defaultHoverContent,
  successContent = "Success",
  failedContent = "Fail",
  successDisplayDurationMs = 1000,
  successTextResetPointMs = 1050,
  failDisplayDurationMs = 2000,
}) => {
  // Updated type for tooltipDisplayStatus to use 'success'
  const [tooltipDisplayStatus, setTooltipDisplayStatus] = useState<
    "hover" | "success" | "failed" | "resetting"
  >("hover");
  const [isTooltipControlledOpen, setIsTooltipControlledOpen] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeouts = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (textResetTimeoutRef.current) {
      clearTimeout(textResetTimeoutRef.current);
      textResetTimeoutRef.current = null;
    }
  }, []);

  const handleTriggerClick = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();

      resetTimeouts();

      setIsTooltipControlledOpen(true);

      try {
        // Execute the parent's action
        const success = await onClickAction();

        if (success) {
          setTooltipDisplayStatus("success");

          // Stage 1: Change text back after `successTextResetPointMs`
          textResetTimeoutRef.current = setTimeout(() => {
            setTooltipDisplayStatus("resetting");
          }, successTextResetPointMs);
          // Stage 2: Hide the tooltip completely after `successDisplayDurationMs`
          hideTimeoutRef.current = setTimeout(() => {
            setIsTooltipControlledOpen(false);
            setTooltipDisplayStatus("hover");
          }, successDisplayDurationMs);
        } else {
          setTooltipDisplayStatus("failed");

          hideTimeoutRef.current = setTimeout(() => {
            setIsTooltipControlledOpen(false);
            setTooltipDisplayStatus("hover");
          }, failDisplayDurationMs);
        }
      } catch (err: unknown) {
        setTooltipDisplayStatus("failed");
        setIsTooltipControlledOpen(true);

        hideTimeoutRef.current = setTimeout(() => {
          setIsTooltipControlledOpen(false);
          setTooltipDisplayStatus("hover");
        }, failDisplayDurationMs);

        if (err instanceof Error) {
          console.error("DynamicTooltip: Action failed:", err.message);
        } else {
          console.error(
            "DynamicTooltip: An unknown error occurred during action.",
          );
        }
      }
    },
    [
      onClickAction,
      successTextResetPointMs,
      successDisplayDurationMs,
      failDisplayDurationMs,
      resetTimeouts,
    ],
  );

  // This function determines the content based on the current tooltipDisplayStatus
  const getTooltipContent = () => {
    switch (tooltipDisplayStatus) {
      case "success":
        return successContent;
      case "failed":
        return failedContent;
      case "resetting":
      case "hover":
      default:
        return defaultHoverContent;
    }
  };

  const handleTooltipOpenChange = useCallback(
    (open: boolean) => {
      if (!isTooltipControlledOpen) {
        if (open) {
          setTooltipDisplayStatus("hover");
        } else {
          setTooltipDisplayStatus("hover");
          resetTimeouts();
        }
      }
    },
    [isTooltipControlledOpen, resetTimeouts],
  );

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip
        open={isTooltipControlledOpen || undefined}
        onOpenChange={handleTooltipOpenChange}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}{" "}
        <TooltipTrigger asChild onClick={handleTriggerClick}>
          {children}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DynamicTooltip;
