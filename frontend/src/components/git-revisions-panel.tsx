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
import { useStore } from "@/store";
import { formatGitRevision } from "@/types/nodes";
import type { AppState } from "@/types/state";
import { Panel } from "@xyflow/react";
import { GitGraph, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { GitStatusCard } from "./git-status-card";

const selector = (state: AppState) => ({
  gitRevisions: state.gitRevisions,
  clearGitRevisions: state.clearGitRevisions,
  gitStatus: state.gitStatus,
  prevGitStatus: state.prevGitStatus,
  restoreGitStatus: state.restoreGitStatus,
  hasRevisions: state.gitRevisions.length > 0,
  displayPanel: state.gitRevisions.length > 0 || state.gitStatus != null,
});

interface GitRevisionsPanelProps {
  openGitGraph: () => void;
}

export const GitRevisionsPanel = ({ openGitGraph }: GitRevisionsPanelProps) => {
  const {
    gitRevisions,
    clearGitRevisions,
    gitStatus,
    prevGitStatus,
    restoreGitStatus,
    hasRevisions,
    displayPanel,
  } = useStore(useShallow(selector));

  const prevRevison = prevGitStatus
    ? formatGitRevision(prevGitStatus.revision)
    : "previous status";

  return (
    displayPanel && (
      <TooltipProvider>
        <Panel position="bottom-right">
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
                      Restore
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Checkout revision {prevRevison}
                  </TooltipContent>
                </Tooltip>
              )}
            />
          )}
          {hasRevisions && (
            <Card className="w-80">
              <CardHeader>
                <CardTitle>Git Revisions</CardTitle>
              </CardHeader>
              <CardContent>
                {gitRevisions.map((rev, index) => (
                  <div key={index} className="p-2 border-b">
                    <span className="font-mono">{rev}</span>
                  </div>
                ))}
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
                {gitRevisions.length === 2 && (
                  <Button onClick={openGitGraph} variant="outline">
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
