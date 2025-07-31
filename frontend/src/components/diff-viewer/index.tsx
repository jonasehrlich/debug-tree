import { CopyButton } from "@/components/action-button";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import React from "react";
import {
  Decoration,
  Diff,
  Hunk,
  parseDiff,
  useSourceExpansion,
  type DiffProps,
  type FileData,
  type HunkData,
  type ViewType,
} from "react-diff-view";
import { Unfold } from "./unfold";

const DiffFile = React.memo(
  ({
    file,
    oldSource,
    ...diffProps
  }: { file: FileData; oldSource: string } & Omit<
    DiffProps,
    "hunks" | "diffType"
  >) => {
    const numChanges = React.useMemo<number>(
      () =>
        file.hunks.reduce((numChanges, hunk) => {
          numChanges += hunk.changes.length;
          return numChanges;
        }, 0),
      [file],
    );
    const [renderDiff, setRenderDiff] = React.useState(numChanges < 1000);
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [hunks, expandRange] = useSourceExpansion(file.hunks, oldSource);
    const numOldLines = oldSource ? oldSource.split("\n").length : 0;

    const renderHunk = (
      children: React.ReactElement<{ hunk: HunkData }>[],
      hunk: HunkData,
      i: number,
      hunks: HunkData[],
    ) => {
      const previousElement = children[children.length - 1] as
        | React.ReactElement<{ hunk: HunkData }>
        | undefined;
      const decorationElement = oldSource ? (
        <Unfold
          key={`decoration-${hunk.content}`}
          previousHunk={previousElement?.props.hunk}
          currentHunk={hunk}
          linesCount={numOldLines}
          onExpand={expandRange}
        />
      ) : (
        <Decoration key={`decoration-${hunk.content}`}>
          {hunk.content}
        </Decoration>
      );
      children.push(decorationElement);

      const hunkElement = <Hunk key={`hunk-${hunk.content}`} hunk={hunk} />;
      children.push(hunkElement);

      if (i === hunks.length - 1 && oldSource) {
        const unfoldTailElement = (
          <Unfold
            key="decoration-tail"
            previousHunk={hunk}
            linesCount={numOldLines}
            onExpand={expandRange}
          />
        );
        children.push(unfoldTailElement);
      }

      return children;
    };

    return (
      <>
        <div className="flex justify-between items-center top-0 z-10 p-2 font-mono sticky bg-muted select-none shadow-sm text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div>
              {file.oldPath !== file.newPath && `${file.oldPath} → `}
              {file.newPath}
            </div>
            <CopyButton value={file.newPath} tooltip={false} />
          </div>
          <Button
            className="size-6"
            variant="ghost"
            onClick={() => {
              setIsCollapsed(!isCollapsed);
            }}
          >
            {isCollapsed ? <ChevronDown /> : <ChevronUp />}{" "}
          </Button>
        </div>
        {!isCollapsed &&
          (renderDiff ? (
            <Diff diffType={file.type} hunks={hunks} {...diffProps}>
              {(hunks) => hunks.reduce(renderHunk, [])}
            </Diff>
          ) : (
            <div className="p-4 flex justify-center">
              <Button
                onClick={() => {
                  setRenderDiff(true);
                }}
                variant="secondary"
              >
                <RefreshCcw />
                Load Diff
              </Button>
            </div>
          ))}
      </>
    );
  },
);

export const DiffViewer = ({
  patch,
  oldSource,
  viewType,
}: {
  /** Patch file content */
  patch: string;
  /** Old source file content */
  oldSource: string;
  viewType: ViewType;
}) => {
  const files = parseDiff(patch);

  if (!files.length) {
    return <div>No diff available</div>;
  }

  return (
    <div>
      {files.map((file, idx) => (
        <div key={idx} className="border">
          <DiffFile
            file={file}
            oldSource={oldSource}
            viewType={viewType}
            className="text-xs"
          />
        </div>
      ))}
    </div>
  );
};
