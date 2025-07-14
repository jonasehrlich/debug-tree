import { cn } from "@/lib/utils";
import * as SelectPrimitive from "@radix-ui/react-select";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./ui/button";

/**
 * Trigger for a select that only consists of a button with an icon
 * @param param0
 * @returns
 */
export const SelectTriggerIcon = ({
  className,
  size = "default",
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
} & VariantProps<typeof buttonVariants>) => {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        buttonVariants({ variant, size, className }),
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center",
        "*:data-[slot=select-value]:gap-2 cursor-pointer",
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  );
};
