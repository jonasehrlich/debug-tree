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

const pathFromFileData = (file: FileData) => {
  return file.type === "delete" ? file.oldPath : file.newPath;
};

export const DiffViewer = ({ diff }: { diff?: ApiDiff }) => {
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

  if (!diff || diff.stats.filesChanged === 0) {
    // TODO check invalid diffs
    return (
      <div className="text-muted-foreground p-2 text-center select-none">
        No diffs to display
      </div>
    );
  }

  const files = parseDiff(diff.patch);
  const paths = files.map((f) => ({
    name: pathFromFileData(f),
    type: f.type,
  }));

  return (
    <div className="flex min-h-0 flex-grow flex-col space-x-4">
      {/* Control elements for the diff */}
      <div className="mb-4 flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
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

      <div className="flex flex-grow space-x-4 overflow-hidden rounded-md">
        {isFileTreeOpen && (
          <FileTree
            paths={paths}
            onFileClick={(path) => {
              scrollDiffIntoView(path);
            }}
          />
        )}
        <div
          ref={containerRef}
          className="flex-grow space-y-4 overflow-y-auto rounded-md"
        >
          {files.map((file, idx) => (
            <DiffFile
              key={idx}
              ref={(el) => {
                diffFileRefs.current[pathFromFileData(file)] = el;
              }}
              file={file}
              oldSource={diff.oldSources[file.oldPath] ?? undefined}
              viewType={diffViewType}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Simple diff viewer component only supporting inline diff view
 */
export const SimpleInlineDiffViewer = ({ diff }: { diff?: ApiDiff }) => {
  if (!diff || diff.stats.filesChanged === 0) {
    return (
      <div className="text-muted-foreground p-2 text-center select-none">
        No diffs to display
      </div>
    );
  }
  const files = parseDiff(diff.patch);
  return (
    <div className="flex min-h-0 flex-grow flex-col space-x-4 overflow-hidden rounded-md">
      <div className="flex-grow space-y-4 overflow-y-auto rounded-md">
        {files.map((file, idx) => (
          <DiffFile
            key={idx}
            file={file}
            oldSource={diff.oldSources[file.oldPath] ?? undefined}
            viewType="unified"
          />
        ))}
      </div>
    </div>
  );
};
