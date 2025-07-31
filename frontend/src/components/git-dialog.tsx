import { fetchCommits, fetchDiffs } from "@/client";
import { cn } from "@/lib/utils";
import { useStore, useUiStore } from "@/store";
import type { Commit, Diff } from "@/types/api-types";
import { formatGitRevision } from "@/types/nodes";
import type { AppState, UiState } from "@/types/state";
import { formatDistanceToNow } from "date-fns";
import { GitBranch, GitCommit, GitCompareArrows, GitGraph } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { CopyButton } from "./action-button";
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
    <div className="space-y-2">
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
      <div className="overflow-hidden text-sm text-muted-foreground font-mono">
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
});

export const GitDialog = () => {
  const { gitRevisions } = useStore(useShallow(selector));
  const { isOpen, setIsOpen } = useUiStore(useShallow(uiSelector));

  const [gitData, setGitData] = React.useState<GitGraphData>();
  const [selectedCommit, setSelectedCommit] = React.useState<Commit | null>(
    null,
  );

  const { theme, systemTheme } = useTheme();
  const getTheme = (theme: string, systemTheme: string) => {
    if (theme === "system") {
      return systemTheme;
    }
    return theme;
  };
  const [isDarkMode, setIsDarkMode] = React.useState(
    getTheme(theme ?? "system", systemTheme ?? "light") === "dark",
  );
  React.useEffect(() => {
    setIsDarkMode(
      getTheme(theme ?? "system", systemTheme ?? "light") === "dark",
    );
  }, [theme, systemTheme]);

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
        className="h-[80vh] w-[80vw] min-w-xs sm:max-w-none sm:max-h-none grid grid-rows-[auto_1fr] p-0 overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle>Git Graph and Diff</DialogTitle>
          <div className="flex space-x-2 select-none">
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

        <Tabs
          defaultValue="tab-graph"
          className="grid grid-rows-[auto_1fr] min-h-0 px-6 pb-6"
        >
          <TabsList>
            <TabsTrigger value="tab-graph">
              <GitBranch />
              Graph
            </TabsTrigger>
            <TabsTrigger value="tab-diff">
              <GitCompareArrows />
              Diff
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab-graph" className="mt-4 min-h-0">
            <div className="flex h-full flex-col gap-4 md:flex-row">
              {/* Left Column */}
              <div className="w-full md:w-3/8">
                <ScrollArea className="h-full rounded-md border text-sm">
                  {gitData?.commits.length ? (
                    <div className="divide-y">
                      {gitData.commits.map((commit) => (
                        <div
                          key={commit.id}
                          className={cn(
                            "text-xs p-2 px-4 truncate text-ellipsis cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/80 select-none cursor-pointer font-mono",
                            {
                              "bg-secondary": selectedCommit?.id === commit.id,
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
              <div className="w-full p-4 md:w-5/8">
                <CommitDetails commit={selectedCommit} />
              </div>
            </div>
          </TabsContent>
          <TabsContent
            value="tab-diff"
            className="h-full min-h-0 w-full text-sm"
          >
            <div className="flex flex-col h-full w-full min-h-o overflow-y-auto space-y-4">
              {gitData?.diffs.length ? (
                gitData.diffs.map((diff, index) => (
                  <ReactDiffViewer
                    leftTitle={diff.old?.path ?? diff.new?.path ?? ""}
                    rightTitle={diff.new?.path ?? ""}
                    oldValue={diff.old?.content ?? ""}
                    newValue={diff.new?.content ?? ""}
                    useDarkTheme={isDarkMode}
                    splitView={false}
                    key={index}
                    disableWordDiff={true}
                    styles={{
                      diffContainer: {
                        minWidth: "200px",
                      },
                    }}
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
      </DialogContent>
    </Dialog>
  );
};
