import { isTagMetadata, type GitMetadata } from "@/client";
import { cn } from "@/lib/utils";
import { formatGitRevision } from "@/types/nodes";
import { GitBranch, Pin, Tag } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { CopyButton } from "./copy-button";
import { DynamicTooltip } from "./dynamic-tooltip";
import { Button } from "./ui/button";
/**
 * @interface GitRevisionProps
 * @description Props for the GitRevisionProps component.
 * @property {string} revision - The text string to be copied to the clipboard.
 */
interface GitRevisionProps {
  revision: GitMetadata;
  onClickPinRevision?: (rev: string) => void;
}

export const GitRevision = ({
  revision,
  onClickPinRevision: onClickPinRevision,
}: GitRevisionProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [formattedRev, setFormattedRev] = useState(formatGitRevision(revision));
  useEffect(() => {
    setFormattedRev(formatGitRevision(revision));
  }, [setFormattedRev, revision]);

  const handlePinCommitId = useCallback(() => {
    if (!onClickPinRevision) {
      return Promise.resolve(false);
    }
    onClickPinRevision(formattedRev);
    return Promise.resolve(true);
  }, [formattedRev, onClickPinRevision]);

  const contentName = "revision";
  const paddedContentName = " " + contentName;

  return (
    <div className={cn("flex flex-1 items-center text-muted-foreground")}>
      {isTagMetadata(revision) ? <Tag size={16} /> : <GitBranch size={16} />}

      <span className="flex-1 font-mono px-3  truncate align-middle">
        {formattedRev}
      </span>
      {onClickPinRevision && (
        <DynamicTooltip
          onClickAction={handlePinCommitId}
          defaultHoverContent={"Pin" + paddedContentName}
          successContent={"Pinned" + paddedContentName}
          failedContent={"Failed to pin" + paddedContentName}
        >
          <Button
            ref={ref}
            variant="ghost"
            className={cn("nodrag size-6 cursor-pointer")}
          >
            <Pin size={16} />
          </Button>
        </DynamicTooltip>
      )}
      <CopyButton
        text={formattedRev}
        contentName={contentName}
        ref={ref as RefObject<HTMLButtonElement>}
      />
    </div>
  );
};
