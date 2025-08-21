import { cn } from "@/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";
export const GhTabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "text-muted-foreground inline-flex w-full items-end border-b",
        className,
      )}
      {...props}
    />
  );
};

export const GhTabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 flex-none items-center gap-1.5 rounded-t-md px-3 py-2",
        "hover:text-foreground -mb-px cursor-pointer data-[state=active]:cursor-default",
        "data-[state=active]:border-b-background rounded-t-lg text-sm data-[state=active]:border",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1",
        "disabled:pointer-events-none disabled:opacity-50",
        "dark:data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
};
