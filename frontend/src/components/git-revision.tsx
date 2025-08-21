import { isTagMetadata, type GitMetadata } from "@/client";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { formatGitRevision } from "@/types/nodes";
import type { AppState } from "@/types/state";
import { ArrowDownToLine, GitBranch, Pin, Tag } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { ActionButton, CopyButton } from "./action-button";

const selector = (s: AppState) => ({
  addPinnedGitRevision: s.addPinnedGitRevision,
  checkoutGitRevision: s.checkoutGitRevision,
});

interface GitRevisionIconProps {
  revision: GitMetadata;
  size?: number;
}
export const GitRevisionIcon = ({
  revision,
  size,
}: GitRevisionIconProps): React.JSX.Element => {
  if (isTagMetadata(revision)) {
    return <Tag size={size} />;
  }
  return <GitBranch size={size} />;
};

/**
 * @interface GitRevisionProps
 * @description Props for the GitRevisionProps component.
 * @property {string} revision - The text string to be copied to the clipboard.
 */
interface GitRevisionProps {
  revision: GitMetadata;
}
export const GitRevision = ({ revision }: GitRevisionProps) => {
  const { addPinnedGitRevision, checkoutGitRevision } = useStore(
    useShallow(selector),
  );

  const formattedRev = React.useMemo(() => {
    return formatGitRevision(revision);
  }, [revision]);

  return (
    <div className={cn("text-muted-foreground flex flex-1 items-center")}>
      <GitRevisionIcon revision={revision} size={16} />
      <span className="flex-1 truncate px-3 align-middle font-mono">
        {formattedRev}
      </span>
      <ActionButton
        tooltipContent="Pin revision"
        icon={<Pin />}
        onClick={() => {
          addPinnedGitRevision(revision);
          return true;
        }}
        className="size-6"
      />
      <CopyButton value={formattedRev} />
      <ActionButton
        tooltipContent="Checkout revision"
        icon={<ArrowDownToLine />}
        onClick={async () => {
          await checkoutGitRevision(formattedRev);
        }}
        className="size-6"
      />
    </div>
  );
};
