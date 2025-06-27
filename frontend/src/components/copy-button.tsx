import { DynamicTooltip } from "@/components/dynamic-tooltip";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { forwardRef, useCallback } from "react";
import { Button } from "./ui/button";
import { type ButtonProps } from "./ui/button-props";

/**
 * @interface CopyButtonProps
 * @description Props for the CopyButtonProps component.
 * @property {string} text - The text string to be copied to the clipboard.
 * @property {string} whatToCopy - What the text is to be copied, the tooltip will then show "Copy "+whatToCopy
 */
type CopyButtonProps = ButtonProps & {
  text: string;
  contentName?: string;
};

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ className, text, contentName, ...props }, ref) => {
    const handleCopyAction = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }, [text]);

    const paddedContentName = contentName ? " " + contentName : "";

    return (
      <DynamicTooltip
        onClickAction={handleCopyAction}
        defaultHoverContent={"Copy" + paddedContentName}
        successContent={"Copied" + paddedContentName}
        failedContent={"Failed to copy" + paddedContentName}
      >
        <Button
          ref={ref}
          variant="ghost"
          className={cn(className, "nodrag size-6 p-1 cursor-pointer")}
          {...props}
        >
          <Copy />
        </Button>
      </DynamicTooltip>
    );
  },
);
