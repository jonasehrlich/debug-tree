import { client } from "@/client";
import { useStore } from "@/store";
import type { components } from "@/types/api";
import type { AppState } from "@/types/state";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { GitCompareArrows } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { GitDiffView } from "./git-diff-view";
import { SlidingPanel } from "./sliding-panel";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface GitGraphSlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const selector = (s: AppState) => ({
  gitRevisions: s.gitRevisions,
});

interface GitGraphData {
  commits: components["schemas"]["Commit"][];
  diffs: components["schemas"]["Diff"][];
}

export const GitGraphSlidingPanel: React.FC<GitGraphSlidingPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { gitRevisions } = useStore(useShallow(selector));

  const [data, setData] = useState<GitGraphData>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This effect can be used to perform any side effects when the panel opens or closes
    if (isOpen && gitRevisions.length >= 1) {
      client
        .GET("/api/v1/git/commits", {
          params: {
            query: {
              baseRev: gitRevisions[0],
              headRev: gitRevisions[1] ?? null,
            },
          },
        })
        .then((response) => {
          setData({
            commits: response.data?.commits ?? [],
            diffs: response.data?.diffs ?? [],
          });
          setLoading(false);
        })
        .catch((error: unknown) => {
          let message = "";
          if (
            typeof error === "object" &&
            error !== null &&
            "message" in error
          ) {
            message = String((error as { message?: unknown }).message);
          }
          toast.error("Error fetching Git Tree data", {
            description: message,
          });
        });
    }
  }, [isOpen, gitRevisions]);

  const [openIndex, setOpenIndex] = useState<null | number>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const [gitDiffIsVisible, setGitDiffIsVisible] = useState(false);
  return (
    <SlidingPanel isOpen={isOpen} onClose={onClose}>
      <div>
        {loading ? (
          <div className="border-b py-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        ) : (
          <div className="flex">
            <GitDiffView
              isVisible={gitDiffIsVisible}
              baseRev={gitRevisions[0]}
              headRev={gitRevisions[1] ?? ""}
              diffs={data?.diffs ?? []}
              className="h-screen flex-col flex mr-4"
            />
            {/* sliding panel right column */}
            <div className="flex-none h-screen space-y-4">
              <h2 className="text-lg font-semibold">Git Tree</h2>
              <Button
                className="cursor-pointer"
                onClick={() => {
                  setGitDiffIsVisible(!gitDiffIsVisible);
                }}
              >
                <GitCompareArrows />
                {gitDiffIsVisible ? "Hide Diff" : "Show Diff"}
              </Button>
              <div className="h-screen overflow-y-auto font-mono w-full">
                {data?.commits.length == 0
                  ? `No commits available for range ${gitRevisions[0]}..${gitRevisions[1]}`
                  : data?.commits.map((commit, index) => {
                      return (
                        <div key={index} className="border-b">
                          <button
                            onClick={() => {
                              toggle(index);
                            }}
                            className="text-left w-full px-2 py-4 hover:bg-secondary/80 cursor-pointer"
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex gap-2 items-center w-full overflow-hidden">
                                <span className="font-bold shrink-0">
                                  {commit.id.slice(0, 7)}
                                </span>
                                <div className="truncate w-full">
                                  {commit.summary}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {commit.author.name} •{" "}
                                {formatDistanceToNow(commit.time, {
                                  addSuffix: true,
                                })}
                              </div>
                            </div>
                          </button>
                          <AnimatePresence initial={false}>
                            {openIndex === index && (
                              <motion.div
                                key="content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.1,
                                  ease: "easeInOut",
                                }}
                                className="overflow-hidden p-4 text-sm text-muted-foreground"
                              >
                                {commit.body !== "" && <p>{commit.body}</p>}
                                <p>
                                  <strong>Date:</strong>{" "}
                                  {new Date(commit.time).toLocaleString()}
                                </p>
                                <p>
                                  <strong>Author:</strong> {commit.author.name}{" "}
                                  {commit.author.email && (
                                    <span> {commit.author.email}</span>
                                  )}
                                </p>
                                <p>
                                  <strong>Committer:</strong>{" "}
                                  {commit.committer.name}{" "}
                                  {commit.author.email && (
                                    <span> {commit.committer.email}</span>
                                  )}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>
        )}
      </div>
    </SlidingPanel>
  );
};
