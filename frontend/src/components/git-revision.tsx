import { cn } from "@/lib/utils";
import { GitBranch } from "lucide-react";
import { useRef, type RefObject } from "react";
import { CopyButton } from "./copy-button";
import { Button } from "./ui/button";

/**
 * @interface GitRevisionProps
 * @description Props for the GitRevisionProps component.
 * @property {string} revision - The text string to be copied to the clipboard.
 */
interface GitRevisionProps {
  revision: string;
  onGitIconClick?: (rev: string) => void;
}

export const GitRevision = ({ revision, onGitIconClick }: GitRevisionProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <div className={cn("flex flex-1 items-center text-muted-foreground")}>
      {onGitIconClick ? (
        <Button
          ref={ref}
          variant="ghost"
          className={cn("nodrag size-6 p-1 cursor-pointer")}
          onClick={(_e) => {
            onGitIconClick(revision);
          }}
        >
          <GitBranch size={20} />
        </Button>
      ) : (
        <GitBranch size={20} />
      )}
      <span className="flex-1 font-mono px-3 py-1 truncate align-middle">
        {revision}
      </span>
      <CopyButton
        text={revision}
        contentName="revision"
        ref={ref as RefObject<HTMLButtonElement>}
      />
    </div>
  );
};
