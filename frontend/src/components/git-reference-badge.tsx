import { cn } from "@/lib/utils";
import type { ReferenceMetadata, ReferenceType } from "@/types/api-types";
import type { VariantProps } from "class-variance-authority";
import { Cloud, FilePen, GitBranch, type LucideIcon, Tag } from "lucide-react";
import React from "react";
import { Badge, badgeVariants } from "./ui/badge";

const REFERENCE_ICON_MAP: Record<
  ReferenceType,
  {
    icon: LucideIcon;
    className?: string;
  } & VariantProps<typeof badgeVariants>
> = {
  tag: { icon: Tag, className: "bg-blue-500 text-white" },
  branch: { icon: GitBranch, className: "bg-violet-700 text-white" },
  note: { icon: FilePen, className: "bg-zinc-200 text-black" },
  remotebranch: {
    icon: Cloud,
    className: "bg-orange-600 text-white",
  },
} as const;

export const GitReferenceBadge = ({
  reference,
  ...props
}: { reference: ReferenceMetadata } & React.ComponentProps<typeof Badge>) => {
  const config = REFERENCE_ICON_MAP[reference.kind];

  const Icon = config.icon;
  return (
    <Badge
      {...props}
      variant={props.variant ?? config.variant}
      className={cn("text-xs select-none", config.className, props.className)}
    >
      {<Icon />}
      {reference.name}
    </Badge>
  );
};
