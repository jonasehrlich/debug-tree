import { client } from "@/client";
import { useStore } from "@/store";
import type { components } from "@/types/api";
import type { AppState } from "@/types/state";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { SlidingPanel } from "./sliding-panel";

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
          setData(response.data?.commits || []);
          setLoading(false);
        })
        .catch((error) => {
          toast.error("Error fetching Git Tree data", {
            description: error.message,
          });
        });
    }
  }, [isOpen, gitRevisions]);
  return (
    <SlidingPanel title="Git Tree" isOpen={isOpen} onClose={onClose}>
      {data.map((commit, index) => (
        <div key={index} className="p-2 border-b font-mono">
          <span className="font-mono">
            {commit.id.slice(0, 7)} {commit.summary}
          </span>
        </div>
      ))}
    </SlidingPanel>
  );
};
