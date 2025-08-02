import { ButtonGroup } from "@/components/button-group";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store";
import type { Diff as ApiDiff } from "@/types/api-types";
import { type UiState } from "@/types/state";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import React from "react";
import { parseDiff, type FileData, type ViewType } from "react-diff-view";
import { useShallow } from "zustand/react/shallow";
import { FileTree } from "../file-tree";
import { DiffFile } from "./file";
const uiSelector = (s: UiState) => ({
  isInlineDiff: s.isInlineDiff,
  setIsInlineDiff: s.setIsInlineDiff,
  diffViewType: (s.isInlineDiff ? "unified" : "split") as ViewType,
});

type Path = string;
type Content = string;

export const DiffViewer = ({ diffs }: { diffs?: ApiDiff[] }) => {
  const { isInlineDiff, setIsInlineDiff, diffViewType } = useUiStore(
    useShallow(uiSelector),
  );

  const [isFileTreeOpen, setIsFileTreeOpen] = React.useState(true);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const diffFileRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const scrollDiffIntoView = (path: string) => {
    const target = diffFileRefs.current[path];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!diffs || diffs.length === 0) {
    // TODO check invalid diffs
    return (
      <div className="text-center p-2 text-muted-foreground select-none">
        No diffs to display
      </div>
    );
  }
  const { files, oldSources } = diffs.reduce<{
    files: FileData[];
    oldSources: Record<Path, Content>;
  }>(
    (acc, diff) => {
      acc.files = acc.files.concat(parseDiff(diff.patch));
      const oldPath = diff.old?.path;
      const oldContent = diff.old?.content;
      if (oldPath && oldContent) {
        acc.oldSources[oldPath] = oldContent;
      }
      return acc;
    },
    { files: [], oldSources: {} },
  );

  const paths = files.map((f) => ({
    name: f.newPath !== "/dev/null" ? f.newPath : f.oldPath,
    type: f.type,
  }));

  return (
    <div className="flex-grow min-h-0 flex flex-col space-x-4">
      {/* Control elements for the diff */}
      <div className="shrink-0 flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setIsFileTreeOpen(!isFileTreeOpen);
          }}
        >
          {isFileTreeOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>

        <ButtonGroup
          selectedButton={isInlineDiff ? "inline" : "split"}
          onChange={(key) => {
            setIsInlineDiff(key === "inline");
          }}
          variant="outline"
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

      <div className="flex flex-grow rounded-md overflow-hidden space-x-4">
        <FileTree
          isOpen={isFileTreeOpen}
          paths={paths}
          onFileClick={(path) => {
            scrollDiffIntoView(path);
          }}
        />
        <div
          ref={containerRef}
          className="flex-grow overflow-y-auto space-y-4 rounded-md"
        >
          {files.map((file, idx) => (
            <DiffFile
              key={idx}
              ref={(el) => {
                diffFileRefs.current[file.newPath] = el;
              }}
              file={file}
              oldSource={oldSources[file.oldPath] ?? undefined}
              viewType={diffViewType}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
