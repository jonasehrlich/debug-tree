import { cn, copyToClipboard } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import type { ButtonProps } from "./ui/button-props";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * @interface ActionButtonProps
 * @description Props for the ActionButton component.
 * @property {string} value - Value to copy
 * @property {string} ctx - Context of the copy button
 */
interface ActionButtonProps extends Omit<ButtonProps, "onClick" | "value"> {
  /**
   * onClick handler for the button, can be sync or async. If a promise is returned and it
   * @returns Whether it was successful. For async functions a resolving promise is interpreted as success
   */
  onClick: () => boolean | Promise<unknown>;
  /** Content of the tooltip, if not defined, no tooltip will be displayed */
  tooltipContent?: string;
  /** Icon to show */
  icon: React.ReactNode;
  /** Text to show in the button  */
  text?: string;
}

/**
 * A button component which shows an icon and changes the icon to a checkmark when the onClick handler
 * is successful
 */
export const ActionButton = ({
  tooltipContent,
  variant = "ghost",
  icon,
  text,
  onClick,
  ...props
}: ActionButtonProps) => {
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!isSuccess) return;

    const timer = setTimeout(() => {
      setIsSuccess(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [isSuccess]);

  const handleClick = React.useCallback(() => {
    const r = onClick();
    if (typeof r === "boolean") {
      setIsSuccess(r);
      return;
    }
    r.then(() => {
      setIsSuccess(true);
    }).catch(() => {
      setIsSuccess(false);
    });
  }, [onClick]);

  const button = (
    <Button
      data-slot="action-button"
      {...props}
      className={props.className}
      variant={variant}
      onClick={handleClick}
      disabled={props.disabled ?? isSuccess}
    >
      <span className="sr-only">{tooltipContent}</span>
      {isSuccess ? <Check data-testid="check-icon" /> : icon}
      {text}
    </Button>
  );
  if (!tooltipContent) {
    return button;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
};

interface CopyButtonProps {
  /** Value to copy onClick */
  value: string;
  /** Whether to show a tooltip */
  tooltip?: boolean | string;
  className?: string;
}

export const CopyButton = ({
  value,
  tooltip = true,
  className = undefined,
}: CopyButtonProps) => {
  return (
    <ActionButton
      className={cn("size-6", className)}
      tooltipContent={
        tooltip === true
          ? "Copy to clipboard"
          : typeof tooltip === "string"
            ? tooltip
            : undefined
      }
      icon={<Copy />}
      onClick={() => {
        return copyToClipboard(value);
      }}
    />
  );
};

CopyButton.displayName = "CopyButton";
