import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/store";
import type { AppState } from "@/types/state";
import { Panel } from "@xyflow/react";
import { GitGraph, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

const selector = (state: AppState) => ({
  gitRevisions: state.gitRevisions,
  clearGitRevisions: state.clearGitRevisions,
});

interface GitRevisionsPanelProps {
  openGitGraph: () => void;
}

export const GitRevisionsPanel = ({ openGitGraph }: GitRevisionsPanelProps) => {
  const { gitRevisions, clearGitRevisions } = useStore(useShallow(selector));

  return (
    gitRevisions.length > 0 && (
      <Panel position="bottom-right">
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
      </Panel>
    )
  );
};
