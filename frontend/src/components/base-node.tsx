import React from "react";

import { cn } from "@/lib/utils";
import Markdown, { type Options as MarkdownOptions } from "react-markdown";

export const BaseNode = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { selected?: boolean }
>(({ className, selected, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-card text-card-foreground relative rounded-md border",
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
  React.HTMLAttributes<HTMLDivElement>): React.ReactElement | null => {
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
  React.HTMLAttributes<HTMLDivElement>): React.ReactElement | null => {
  if (!children) return null;
  return (
    <div className={cn("px-3 py-2", className)} {...props}>
      {children}
    </div>
  );
};

NodeSection.displayName = "NodeSection";

interface NodeMarkdownSectionProps {
  children?: string;
  markdownOptions?: Omit<MarkdownOptions, "children">;
}
/**
 * A node segment which renders with meaningful padding which renders its content as markdown.
 * If no content is available it does not exist.
 */
export const NodeMarkdownSection = ({
  children,
  className,
  markdownOptions,
  ...props
}: NodeMarkdownSectionProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, "children">) => {
  if (!children) return null;
  return (
    <NodeSection className={cn(className, "prose prose-markdown")} {...props}>
      <Markdown {...markdownOptions} children={children}></Markdown>
    </NodeSection>
  );
};

NodeMarkdownSection.displayName = "NodeMarkdownSection";
