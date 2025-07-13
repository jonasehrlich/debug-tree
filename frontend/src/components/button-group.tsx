import { cn } from "@/lib/utils";
import React from "react";

interface ButtonGroupProps {
  children:
    | React.ReactElement<{ className: string }>
    | React.ReactElement<{ className: string }>[];
  className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  const validChildren = React.Children.toArray(children).filter(Boolean);

  return (
    <div
      className={cn("inline-flex overflow-hidden border rounded-md", className)}
    >
      {validChildren.map((child, index) => {
        if (!React.isValidElement<{ className: string }>(child)) return null;

        const isFirst = index === 0;
        const isLast = index === validChildren.length - 1;

        return React.cloneElement<{ className: string }>(child, {
          className: cn(
            "rounded-none border-l first:border-l-0", // cleanup internal borders
            isFirst && "rounded-l-md",
            isLast && "rounded-r-md",
            child.props.className,
          ),
        });
      })}
    </div>
  );
}
