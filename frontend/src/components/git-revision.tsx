import { isTagMetadata, type GitMetadata } from "@/client";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { formatGitRevision } from "@/types/nodes";
import type { AppState } from "@/types/state";
import { GitBranch, Pin, Tag } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { ConfirmingButton, CopyButton } from "./confirming-button";

/**
 * @interface GitRevisionProps
 * @description Props for the GitRevisionProps component.
 * @property {string} revision - The text string to be copied to the clipboard.
 */
interface GitRevisionProps {
  revision: GitMetadata;
}

const selector = (s: AppState) => ({
  addGitRevision: s.addGitRevision,
});

export const GitRevision = ({ revision }: GitRevisionProps) => {
  const { addGitRevision } = useStore(useShallow(selector));

  const formattedRev = React.useMemo(() => {
    return formatGitRevision(revision);
  }, [revision]);

  return (
    <div className={cn("flex flex-1 items-center text-muted-foreground")}>
      {isTagMetadata(revision) ? <Tag size={16} /> : <GitBranch size={16} />}
      <span className="flex-1 font-mono px-3  truncate align-middle">
        {formattedRev}
      </span>
      <ConfirmingButton
        tooltipContent="Pin revision"
        icon={<Pin />}
        onClick={() => {
          addGitRevision(formattedRev);
          return true;
        }}
        className="size-6"
      />
      <CopyButton value={formattedRev} />
    </div>
  );
};
