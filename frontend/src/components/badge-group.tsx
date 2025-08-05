import { cn } from "@/lib/utils";
import React from "react";
import { Badge } from "./ui/badge";

type BadgeProps = React.ComponentProps<typeof Badge>;

interface BadgeGroupProps {
  segments: BadgeProps[];
}

export const BadgeGroup = React.memo(
  ({ segments, ...props }: BadgeGroupProps & BadgeProps) => {
    return (
      <span className="gap-0 inline-flex items-stretch">
        {segments.map((segment, idx) => {
          const classNames = [];
          if (idx !== 0) {
            classNames.push("rounded-l-none");
          }
          if (idx !== segments.length - 1) {
            classNames.push("rounded-r-none");
          }
          return (
            <Badge
              {...props}
              {...segment}
              key={idx}
              className={cn(props.className, segment.className, ...classNames)}
            />
          );
        })}
      </span>
    );
  },
);
