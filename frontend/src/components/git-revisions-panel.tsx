import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore, useUiStore } from "@/store";
import { formatGitRevision } from "@/types/nodes";
import type { AppState, UiState } from "@/types/state";
import { Panel } from "@xyflow/react";
import { GitGraph, RotateCcw, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { CopyButton } from "./action-button";
import { GitStatusCard } from "./git-status-card";

const selector = (state: AppState) => ({
  pinnedGitRevisions: state.pinnedGitRevisions,
  clearGitRevisions: state.clearPinnedGitRevisions,
  gitStatus: state.gitStatus,
  prevGitStatus: state.prevGitStatus,
  restoreGitStatus: state.restoreGitStatus,
  hasRevisions: state.pinnedGitRevisions[0] !== null,
  displayPanel: state.pinnedGitRevisions[0] !== null || state.gitStatus != null,
});

const uiSelector = (s: UiState) => ({
  setIsGitDialogOpen: s.setIsGitDialogOpen,
});

export const GitRevisionsPanel = () => {
  const {
    pinnedGitRevisions,
    clearGitRevisions,
    gitStatus,
    prevGitStatus,
    restoreGitStatus,
    hasRevisions,
    displayPanel,
  } = useStore(useShallow(selector));

  const { setIsGitDialogOpen } = useUiStore(useShallow(uiSelector));

  const prevRevision = prevGitStatus
    ? formatGitRevision(prevGitStatus.revision)
    : "previous status";

  return (
    displayPanel && (
      <TooltipProvider>
        <Panel position="bottom-left" className="space-y-4">
          {gitStatus && (
            <GitStatusCard
              status={gitStatus}
              footer={() => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        restoreGitStatus()
                          .then()
                          .catch((e: unknown) => {
                            console.warn("Failed to restore git status:", e);
                          });
                      }}
                      variant="destructive"
                      className="max-w-[150px] truncate"
                    >
                      <RotateCcw />
                      Restore
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Checkout revision {prevRevision}
                  </TooltipContent>
                </Tooltip>
              )}
            />
          )}
          {hasRevisions && (
            <Card className="w-80 gap-4">
              <CardHeader>
                <CardTitle>Git Revisions</CardTitle>
              </CardHeader>
              <CardContent className="divide-y text-sm">
                {pinnedGitRevisions.map(
                  (rev, index) =>
                    rev && (
                      <div key={index} className="py-2 flex justify-between">
                        <span className="font-mono block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                          {formatGitRevision(rev)}
                        </span>
                        <CopyButton value={rev.rev} tooltip={false} />
                      </div>
                    ),
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => {
                    clearGitRevisions();
                  }}
                  variant="destructive"
                >
                  <X /> Clear
                </Button>
                {pinnedGitRevisions[1] !== null && (
                  <Button
                    onClick={() => {
                      setIsGitDialogOpen(true);
                    }}
                    variant="outline"
                  >
                    <GitGraph />
                    Show Graph
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </Panel>
      </TooltipProvider>
    )
  );
};
