import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TypedEventSource } from "@/lib/sse";
import { cn } from "@/lib/utils";
import { useStore, useUiStore } from "@/store";
import type { RepositoryStatus } from "@/types/api-types";
import { formatGitRevision } from "@/types/nodes";
import type { AppState, UiState } from "@/types/state";
import log from "loglevel";
import {
  FileDiff,
  FileInput,
  FileMinus,
  FilePlus,
  GitBranch,
  GitCommitVertical,
  GitGraph,
  Pin,
  X,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const _logger = log.getLogger("status-bar");

const StatusBarItem = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "flex h-full items-center gap-1 px-2",
        "text-sm [&>svg]:h-3 [&>svg]:w-3",
        // "[&>svg]:w-3 [&>svg]:h-3 text-xs",
        className,
      )}
      {...props}
    ></div>
  );
};

const BranchStatusBarItem = React.memo(
  ({ status }: { status: RepositoryStatus }) => {
    if (status.isDetachedHead) {
      return (
        // TODO: Allow checking out a branch on the commit
        <StatusBarItem>
          <GitCommitVertical /> {status.head.id.slice(0, 7)}
        </StatusBarItem>
      );
    }
    // TODO: Allow creating a branch/tag or switching branch

    return (
      <StatusBarItem>
        <GitBranch /> {status.currentBranch}
      </StatusBarItem>
    );
  },
);

const GitStatusFileList = ({
  paths,
  icon,
  className,
  ...props
}: {
  paths: string[];
  icon: LucideIcon;
} & React.ComponentProps<"div">) => {
  const Icon = icon;
  return (
    <>
      {paths.map((path) => {
        return (
          <div
            className={cn(
              "flex items-center gap-1 pl-1 font-mono text-sm",
              className,
            )}
            {...props}
          >
            <Icon size={14} className="shrink-0" /> {path}
          </div>
        );
      })}
    </>
  );
};

const ChangesStatusBarItem = React.memo(
  ({ status }: { status: RepositoryStatus }) => {
    const added =
      status.index.newFiles.length + status.worktree.newFiles.length;
    const modified =
      status.index.modifiedFiles.length + status.worktree.modifiedFiles.length;
    const renamed =
      status.index.renamedFiles.length + status.worktree.renamedFiles.length;
    const deleted =
      status.index.deletedFiles.length + status.worktree.deletedFiles.length;

    const indexChanges =
      status.index.newFiles.length +
      status.index.modifiedFiles.length +
      status.index.renamedFiles.length +
      status.index.deletedFiles.length;
    const worktreeChanges =
      status.worktree.newFiles.length +
      status.worktree.modifiedFiles.length +
      status.worktree.renamedFiles.length +
      status.worktree.deletedFiles.length;
    if (added + deleted + renamed + modified === 0) {
      return null;
    }
    return (
      <Popover>
        <PopoverTrigger asChild>
          <StatusBarItem>
            {added > 0 && (
              <>
                <FilePlus /> {added}
              </>
            )}
            {deleted > 0 && (
              <>
                <FileMinus /> {deleted}
              </>
            )}
            {renamed > 0 && (
              <>
                <FileInput />
                {renamed}
              </>
            )}
            {modified > 0 && (
              <>
                <FileDiff /> {modified}
              </>
            )}
          </StatusBarItem>
        </PopoverTrigger>
        <PopoverContent className="w-fit space-y-1">
          {indexChanges > 0 && (
            <>
              <h4 className="font-medium">Index</h4>
              <div className="text-emerald-600">
                <GitStatusFileList
                  paths={status.index.newFiles}
                  icon={FilePlus}
                />
                <GitStatusFileList
                  paths={status.index.modifiedFiles}
                  icon={FileDiff}
                />
                <GitStatusFileList
                  paths={status.index.renamedFiles}
                  icon={FileInput}
                />
                <GitStatusFileList
                  paths={status.index.deletedFiles}
                  icon={FileMinus}
                />
              </div>
            </>
          )}
          {worktreeChanges > 0 && (
            <>
              <h4 className="font-medium">Worktree</h4>
              <div className="text-red-600">
                <GitStatusFileList
                  paths={status.worktree.newFiles}
                  icon={FilePlus}
                />
                <GitStatusFileList
                  paths={status.worktree.modifiedFiles}
                  icon={FileDiff}
                />
                <GitStatusFileList
                  paths={status.worktree.renamedFiles}
                  icon={FileInput}
                />
                <GitStatusFileList
                  paths={status.worktree.deletedFiles}
                  icon={FileMinus}
                />
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    );
  },
);

const uiSelector = (s: UiState) => ({
  setIsGitDialogOpen: s.setIsGitDialogOpen,
});

const selector = (state: AppState) => ({
  pinnedGitRevisions: state.pinnedGitRevisions,
  clearPinnedGitRevisions: state.clearPinnedGitRevisions,
  gitStatus: state.gitStatus,
  prevGitStatus: state.prevGitStatus,
  restoreGitStatus: state.restoreGitStatus,
  hasRevisions: state.pinnedGitRevisions[0] !== null,
  displayPanel: state.pinnedGitRevisions[0] !== null || state.gitStatus != null,
});

export const PinnedRevisionsStatusBarItem = () => {
  const { pinnedGitRevisions, clearPinnedGitRevisions, hasRevisions } =
    useStore(useShallow(selector));
  const { setIsGitDialogOpen } = useUiStore(useShallow(uiSelector));

  return (
    <StatusBarItem>
      <Popover>
        <PopoverTrigger>
          <>
            <Pin />
            {hasRevisions && (
              <>
                {pinnedGitRevisions.map(
                  (rev, index) =>
                    rev && (
                      <div key={index} className="flex items-center py-2">
                        {formatGitRevision(rev)}
                        {/* <CopyButton value={rev.rev} tooltip={false}  /> */}
                      </div>
                    ),
                )}
              </>
            )}
          </>
        </PopoverTrigger>
        <PopoverContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="leading-none font-medium">Pinned Git Revisions</h4>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="base">Base</Label>
                <Input
                  id="width"
                  defaultValue="100%"
                  className="col-span-2 h-8"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasRevisions && (
        <>
          <Button
            disabled={pinnedGitRevisions[1] === null}
            variant="destructive"
            className="has-[>svg]:px-1"
            onClick={() => {
              clearPinnedGitRevisions();
            }}
          >
            <X />
          </Button>
          <Button
            disabled={pinnedGitRevisions[1] === null}
            variant="secondary"
            onClick={() => {
              setIsGitDialogOpen(true);
            }}
          >
            <GitGraph />
          </Button>
        </>
      )}
    </StatusBarItem>
  );
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GitStatusEventMap = {
  "git-status": RepositoryStatus; // custom event payload
};

export const StatusBar = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const [repositoryStatus, setRepositoryStatus] =
    React.useState<null | RepositoryStatus>(null);

  React.useEffect(() => {
    // // First fetch the repository status when the component is mounted
    // fetchRepositoryStatus()
    //   .then((data) => {
    //     setRepositoryStatus(data);
    //   })
    //   .catch((err: unknown) => {
    //     notify.error(err);
    //   });

    const es = new TypedEventSource<GitStatusEventMap>(
      "/api/v1/git/repository/status/stream",
    );
    es.onOpen(() => {
      _logger.info("SSE connection established");
    });
    es.onError(() => {
      _logger.warn("SSE connection lost");
    });
    es.on("git-status", (ev) => {
      console.log("new repository status", ev.data);
      setRepositoryStatus(ev.data); // prepend latest
    });

    return () => {
      es.close();
    };
  }, []);

  if (repositoryStatus === null) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-background flex h-9 cursor-default items-center divide-x divide-solid overflow-hidden rounded-md border shadow-xs",
        className,
      )}
      {...props}
    >
      <BranchStatusBarItem status={repositoryStatus} />
      <ChangesStatusBarItem status={repositoryStatus} />
      {/* <PinnedRevisionsStatusBarItem /> */}
    </div>
  );
};
