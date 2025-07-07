import { client } from "@/client";
import { useStore } from "@/store";
import type { components } from "@/types/api";
import type { AppState } from "@/types/state";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { SlidingPanel } from "./sliding-panel";
import { Skeleton } from "./ui/skeleton";

interface GitGraphSlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const selector = (s: AppState) => ({
  gitRevisions: s.gitRevisions,
});

export const GitGraphSlidingPanel: React.FC<GitGraphSlidingPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { gitRevisions } = useStore(useShallow(selector));

  const [data, setData] = useState<components["schemas"]["Commit"][]>([]);
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
          setData(response.data?.commits ?? []);
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
  return (
    <SlidingPanel title="Git Tree" isOpen={isOpen} onClose={onClose}>
      <div>
        {loading ? (
          <div className="border-b py-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        ) : (
          data.map((commit, index) => {
            return (
              <div key={index} className="border-b font-mono">
                <button
                  onClick={() => {
                    toggle(index);
                  }}
                  className={`w-full text-left px-2 py-4 hover:bg-secondary/80 cursor-pointer"
                }`}
                >
                  <div>
                    <span className="font-bold pr-2">
                      {commit.id.slice(0, 7)}
                    </span>
                    {commit.summary}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {commit.author.name} •{" "}
                    {formatDistanceToNow(commit.time, { addSuffix: true })}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {openIndex === index && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.1, ease: "easeInOut" }}
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
                        <strong>Committer:</strong> {commit.committer.name}{" "}
                        {commit.author.email && (
                          <span> {commit.committer.email}</span>
                        )}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </SlidingPanel>
  );
};
