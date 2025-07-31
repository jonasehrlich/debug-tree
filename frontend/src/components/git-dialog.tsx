import { fetchCommits, fetchDiffs } from "@/client";
import { cn } from "@/lib/utils";
import { useStore, useUiStore } from "@/store";
import type { Commit, Diff } from "@/types/api-types";
import { formatGitRevision } from "@/types/nodes";
import type { AppState, UiState } from "@/types/state";
import { formatDistanceToNow } from "date-fns";
import { GitBranch, GitCommit, GitCompareArrows, GitGraph } from "lucide-react";
import React from "react";
import type { ViewType } from "react-diff-view";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { CopyButton } from "./action-button";
import { ButtonGroup } from "./button-group";
import { DiffViewer } from "./diff-viewer";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const CommitDetails = ({ commit }: { commit: Commit | null }) => {
  if (!commit) {
    return (
      <div className="text-muted-foreground text-sm text-center">
        Select a commit to see its details
      </div>
    );
  }
  return (
    <div className="space-y-2 border rounded-md p-2">
      <div className="font-semibold items-center flex justify-between">
        <div className="font-mono">
          {commit.id.slice(0, 7)} {commit.summary}
        </div>
        <div>
          <CopyButton value={commit.id} />
        </div>
      </div>
      <div className="text-xs font-italic text-muted-foreground italic">
        committed{" "}
        {formatDistanceToNow(commit.time, {
          addSuffix: true,
        })}
      </div>

      <div className="prose prose-markdown max-w-none rounded-md py-2">
        <Markdown children={commit.body} />
      </div>
      <div className="overflow-hidden text-xs text-muted-foreground font-mono">
        <p>
          <strong>Date:</strong> {new Date(commit.time).toLocaleString()}
        </p>
        <p>
          <strong>Author:</strong> {commit.author.name}{" "}
          {commit.author.email && <span> {commit.author.email}</span>}
        </p>
        <p>
          <strong>Committer:</strong> {commit.committer.name}{" "}
          {commit.author.email && <span> {commit.committer.email}</span>}
        </p>
      </div>
    </div>
  );
};

interface GitGraphData {
  commits: Commit[];
  diffs: Diff[];
}

const selector = (s: AppState) => ({
  gitRevisions: s.pinnedGitRevisions,
  clearGitRevisions: s.clearPinnedGitRevisions,
});

const uiSelector = (s: UiState) => ({
  isOpen: s.isGitDialogOpen,
  setIsOpen: s.setIsGitDialogOpen,
  isInlineDiff: s.isInlineDiff,
  setIsInlineDiff: s.setIsInlineDiff,
  diffViewType: (s.isInlineDiff ? "unified" : "split") as ViewType,
});

export const GitDialog = () => {
  const { gitRevisions } = useStore(useShallow(selector));
  const { isOpen, setIsOpen, isInlineDiff, setIsInlineDiff, diffViewType } =
    useUiStore(useShallow(uiSelector));

  const [gitData, setGitData] = React.useState<GitGraphData>();
  const [selectedCommit, setSelectedCommit] = React.useState<Commit | null>(
    null,
  );

  React.useEffect(() => {
    if (!isOpen || gitRevisions[0] === null || gitRevisions[1] === null) {
      return;
    }
    const commitRange = {
      baseRev: gitRevisions[0].rev,
      headRev: gitRevisions[1].rev,
    };
    Promise.all([fetchCommits(commitRange), fetchDiffs(commitRange)])
      .then(([commits, diffs]) => {
        setGitData({
          commits,
          diffs,
        });
      })
      .catch((error: unknown) => {
        let message = "Unknown Error";
        if (typeof error === "object" && error !== null && "message" in error) {
          message = String((error as { message?: unknown }).message);
        }
        toast.error("Error fetching Git Tree data", {
          description: message,
        });
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
            <Badge variant="secondary">
              <GitCommit />
              {gitData?.commits.length} commits
            </Badge>
            <Badge variant="secondary">
              <GitCompareArrows />
              {gitData?.diffs.length} files changed
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
            <TabsList className="shrink-0">
              <TabsTrigger value="tab-graph">
                <GitBranch />
                Graph
              </TabsTrigger>
              <TabsTrigger value="tab-diff">
                <GitCompareArrows />
                Diff
              </TabsTrigger>
            </TabsList>

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
                      <div className="divide-y font-mono">
                        {gitData.commits.map((commit) => (
                          <div
                            key={commit.id}
                            className={cn(
                              "text-xs p-2 px-4 truncate text-ellipsis cursor-pointer hover:bg-secondary/80",
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
                            {commit.summary}
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
                <div className="w-full md:w-5/8 flex-grow overflow-y-auto space-y-4">
                  <CommitDetails commit={selectedCommit} />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="tab-diff"
              className="flex-grow min-h-0 flex flex-col pt-4"
            >
              <div className="shrink-0 flex items-center gap-2 mb-4">
                <ButtonGroup
                  selectedButton={isInlineDiff ? "inline" : "split"}
                  onChange={(key) => {
                    setIsInlineDiff(key === "inline");
                  }}
                  variant="outline"
                  size="sm"
                  buttons={[
                    {
                      key: "inline",
                      label: "Inline View",
                    },
                    {
                      key: "split",
                      label: "Split View",
                    },
                  ]}
                />
              </div>
              <div className="flex-grow overflow-y-auto space-y-4">
                {gitData?.diffs.length ? (
                  gitData.diffs.map((diff, index) => (
                    <DiffViewer
                      key={index}
                      patch={diff.patch}
                      oldSource={diff.old?.content ?? ""}
                      viewType={diffViewType}
                    />
                  ))
                ) : (
                  <div className="text-center p-2 text-muted-foreground select-none">
                    No diffs to display
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
