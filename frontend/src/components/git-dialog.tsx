import { fetchCommits, fetchDiffs } from "@/client";
import { cn } from "@/lib/utils";
import { useStore, useUiStore } from "@/store";
import type { CommitWithReferences, Diff } from "@/types/api-types";
import { formatGitRevision } from "@/types/nodes";
import type { AppState, UiState } from "@/types/state";
import { formatDistanceToNow } from "date-fns";
import { FileDiff, GitCommitVertical, GitGraph, Info } from "lucide-react";
import React from "react";
import Markdown from "react-markdown";
import { useShallow } from "zustand/react/shallow";
import { notify } from "../lib/notify";
import { CopyButton } from "./action-button";
import { DiffViewer, SimpleInlineDiffViewer } from "./diff-viewer";
import { GhTabsList, GhTabsTrigger } from "./gh-tabs";
import { GitReferenceBadge } from "./git-reference-badge";
import { GitStatsChart } from "./git-stats";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent } from "./ui/tabs";

const CommitDetails = ({ commit }: { commit: CommitWithReferences | null }) => {
  const [diff, setDiff] = React.useState<Diff | null>(null);

  React.useEffect(() => {
    if (!commit) {
      setDiff(null);
      return;
    }
    fetchDiffs({ baseRev: `${commit.id}^`, headRev: commit.id })
      .then((data) => {
        setDiff(data);
      })
      .catch((error: unknown) => {
        notify.error(error);
      });
  }, [commit]);

  if (!commit) {
    return (
      <div className="text-muted-foreground text-sm text-center">
        Select a commit to see its details
      </div>
    );
  }
  return (
    <div className="flex-grow flex-col space-y-2 overflow-y-auto">
      <div className="font-semibold items-center flex justify-between">
        <div className="font-mono">
          {commit.id.slice(0, 7)} {commit.summary}
        </div>
        <div className="flex">
          <CopyButton value={commit.id} tooltip="Copy Commit ID" />
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" className="size-6">
                <Info />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="text-xs font-mono">
              <p>
                <strong>Date:</strong> {new Date(commit.time).toLocaleString()}
              </p>
              <p>
                <strong>Author:</strong> {commit.author.name}{" "}
                {commit.author.email && (
                  <span>&lt;{commit.author.email}&gt;</span>
                )}
              </p>
              <p>
                <strong>Committer:</strong> {commit.committer.name}{" "}
                {commit.author.email && (
                  <span>&lt;{commit.committer.email}&gt;</span>
                )}
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      <div className="flex text-xs font-italic text-muted-foreground italic">
        committed{" "}
        {formatDistanceToNow(commit.time, {
          addSuffix: true,
        })}
      </div>
      {commit.references.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {commit.references.map((ref, idx) => (
            <GitReferenceBadge key={idx} reference={ref} />
          ))}
        </div>
      )}

      {commit.body && (
        <div className="prose prose-markdown max-w-none rounded-md">
          <Markdown children={commit.body} />
        </div>
      )}
      <div className="overflow-hidden text-xs text-muted-foreground font-mono"></div>
      <SimpleInlineDiffViewer diff={diff ?? undefined} />
    </div>
  );
};

interface GitGraphData {
  commits: CommitWithReferences[];
  diff: Diff;
}

const selector = (s: AppState) => ({
  gitRevisions: s.pinnedGitRevisions,
  clearGitRevisions: s.clearPinnedGitRevisions,
});

const uiSelector = (s: UiState) => ({
  isOpen: s.isGitDialogOpen,
  setIsOpen: s.setIsGitDialogOpen,
});

export const GitDialog = () => {
  const { gitRevisions } = useStore(useShallow(selector));
  const { isOpen, setIsOpen } = useUiStore(useShallow(uiSelector));

  const [gitData, setGitData] = React.useState<GitGraphData>();
  const [selectedCommit, setSelectedCommit] =
    React.useState<CommitWithReferences | null>(null);

  React.useEffect(() => {
    if (!isOpen || gitRevisions[0] === null || gitRevisions[1] === null) {
      return;
    }
    const commitRange = {
      baseRev: gitRevisions[0].rev,
      headRev: gitRevisions[1].rev,
    };
    Promise.all([fetchCommits(commitRange), fetchDiffs(commitRange)])
      .then(([commits, diff]) => {
        setGitData({
          commits,
          diff,
        });
      })
      .catch((error: unknown) => {
        notify.error(error);
      });
  }, [isOpen, gitRevisions]);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedCommit(null);
    }
  }, [isOpen, setSelectedCommit]);

  if (gitRevisions[0] === null || gitRevisions[1] === null) {
    return null;
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="w-[80vw] h-[80vh] sm:max-w-[80vw] min-w-md p-0 flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle>Git Graph and Diff</DialogTitle>
          <div className="flex flex-wrap gap-2 select-none">
            <Badge variant="secondary" className="font-mono">
              <GitGraph /> {formatGitRevision(gitRevisions[0])}..
              {formatGitRevision(gitRevisions[1])}
            </Badge>
          </div>
        </DialogHeader>

        {/*
          The main content area uses flex-grow to fill available space and min-h-0
          to prevent its children from overflowing the dialog boundaries.
        */}
        <div className="flex-grow px-6 pb-6 min-h-0">
          <Tabs
            defaultValue="tab-graph"
            className="w-full h-full flex flex-col"
          >
            <GhTabsList className="shrink-0 justify-between">
              <div>
                <GhTabsTrigger value="tab-graph">
                  <GitGraph />
                  Commits
                  <Badge variant="secondary" className="text-inherit">
                    {gitData?.commits.length}
                  </Badge>
                </GhTabsTrigger>
                <GhTabsTrigger value="tab-diff">
                  <FileDiff />
                  Files changed
                  <Badge variant="secondary" className="text-inherit">
                    {gitData?.diff.stats.filesChanged}
                  </Badge>
                </GhTabsTrigger>
              </div>
              {gitData && (
                <div className="py-2 text-xs">
                  <GitStatsChart
                    insertedLines={gitData.diff.stats.insertions}
                    deletedLines={gitData.diff.stats.deletions}
                    oldSourceNumLines={gitData.diff.stats.totalOldNumLines}
                  />
                </div>
              )}
            </GhTabsList>

            {/*
              Each TabsContent panel must also grow and have min-h-0 to ensure
              its internal scrolling elements behave correctly.
            */}
            <TabsContent value="tab-graph" className="flex-grow min-h-0 pt-4">
              <div className="flex flex-col md:flex-row h-full gap-4">
                {/* Left Column */}
                <div className="w-full md:w-3/8 max-h-[150px] md:max-h-full">
                  <ScrollArea className="h-full rounded-md border text-sm">
                    {gitData?.commits.length ? (
                      <div className="divide-y">
                        {gitData.commits.map((commit) => (
                          <div
                            key={commit.id}
                            className={cn(
                              "text-xs flex py-1 px-2 items-center cursor-pointer hover:bg-secondary/80",
                              "dark:hover:bg-secondary/80 select-none cursor-pointer",
                              {
                                "bg-secondary":
                                  selectedCommit?.id === commit.id,
                              },
                            )}
                            onClick={() => {
                              if (
                                selectedCommit &&
                                selectedCommit.id == commit.id
                              ) {
                                setSelectedCommit(null);
                              } else {
                                setSelectedCommit(commit);
                              }
                            }}
                          >
                            <GitCommitVertical className="shrink-0 " />
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap gap-1">
                                {commit.summary}
                                <div className="text-xs flex text-muted-foreground">
                                  {formatDistanceToNow(commit.time, {
                                    addSuffix: true,
                                  })}
                                </div>
                              </div>
                              {commit.references.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {commit.references.map((ref, idx) => (
                                    <GitReferenceBadge
                                      key={idx}
                                      reference={ref}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-2 text-muted-foreground select-none">
                        No commits to display
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Right Column */}
                <div className="w-full md:w-5/8 space-y-2 border flex-col flex-grow min-h-0 flex rounded-md p-2 overflow-hidden">
                  <CommitDetails commit={selectedCommit} />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="tab-diff"
              className="flex-grow min-h-0 flex flex-col pt-4"
            >
              <DiffViewer diff={gitData?.diff} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
