import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const BaseNode = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { selected?: boolean }
>(({ className, selected, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-md border bg-card text-card-foreground",
      className,
      selected ? "border-muted-foreground shadow-lg" : "",
      "hover:ring-1",
    )}
    tabIndex={0}
    {...props}
  />
));

BaseNode.displayName = "BaseNode";

interface NodeSectionProps {
  children: React.ReactNode;
}

/**
 * Wrapper around {@link NodeSection} components, used to apply
 * common classes (e.g. divide-y)
 */
export const NodeContent = ({
  children,
  ...props
}: NodeSectionProps &
  HTMLAttributes<HTMLDivElement>): React.ReactElement | null => {
  if (!children) return null;
  return <div {...props}>{children}</div>;
};
NodeContent.displayName = "NodeContent";

/**
 * General node segment with meaningful padding
 */
export const NodeSection = ({
  children,
  className,
  ...props
}: NodeSectionProps &
  HTMLAttributes<HTMLDivElement>): React.ReactElement | null => {
  if (!children) return null;
  return (
    <div className={cn("px-3 py-2", className)} {...props}>
      {children}
    </div>
  );
};

NodeSection.displayName = "NodeSection";
