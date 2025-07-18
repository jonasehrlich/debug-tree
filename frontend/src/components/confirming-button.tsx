import { copyToClipboard } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import React, { useCallback } from "react";
import { Button } from "./ui/button";
import type { ButtonProps } from "./ui/button-props";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * @interface ConfirmingButtonProps
 * @description Props for the ConfirmingButtonProps component.
 * @property {string} value - Value to copy
 * @property {string} ctx - Context of the copy button
 */
interface ConfirmingButtonProps extends Omit<ButtonProps, "onClick" | "value"> {
  /**
   * onClick handler for the button, can be sync or async. If a promise is returned and it
   * @returns Whether it was successful. For async functions a resolving promise is interpreted as success
   */
  onClick: () => boolean | Promise<unknown>;
  /** Content of the tooltip */
  tooltipContent: string;
  /** Icon to show */
  icon: React.ReactNode;
  /** Text to show in the button  */
  text?: string;
}

/**
 * A button component which shows an icon and changes the icon to a checkmark when the onClick handler
 * is successful
 */
export const ConfirmingButton = ({
  tooltipContent,
  variant = "ghost",
  icon,
  text,
  onClick,
  ...props
}: ConfirmingButtonProps) => {
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

  const handleClick = useCallback(() => {
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-slot="confirming-button"
          {...props}
          className={props.className}
          variant={variant}
          onClick={handleClick}
          disabled={props.disabled ?? isSuccess}
        >
          <span className="sr-only">{tooltipContent}</span>
          {isSuccess ? <Check /> : icon}
          {text}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
};

interface CopyButtonProps {
  /** Value to copy onClick */
  value: string;
}

export const CopyButton = ({ value }: CopyButtonProps) => {
  return (
    <ConfirmingButton
      className="size-6"
      tooltipContent="Copy to clipboard"
      icon={<Copy />}
      onClick={() => {
        return copyToClipboard(value);
      }}
    />
  );
};

CopyButton.displayName = "CopyButton";
