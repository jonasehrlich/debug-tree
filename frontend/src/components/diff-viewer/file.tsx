import { CopyButton } from "@/components/action-button";
import { GitStatChart } from "@/components/git-stat";
import { Button } from "@/components/ui/button";
import { type ChangeType } from "gitdiff-parser";
import { ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import React from "react";
import {
  Decoration,
  Diff,
  Hunk,
  useSourceExpansion,
  type DiffProps,
  type FileData,
  type HunkData,
} from "react-diff-view";
import { Unfold } from "./unfold";

// Normal changes are unchanged lines
type GitStat = Record<ChangeType, number>;
export const DiffFile = React.memo(
  ({
    file,
    oldSource,
    ...diffProps
  }: { file: FileData; oldSource: string } & Omit<
    DiffProps,
    "hunks" | "diffType"
  >) => {
    const gitStats = React.useMemo<GitStat>(
      () =>
        file.hunks.reduce(
          (stat, hunk) => {
            stat = hunk.changes.reduce((stat, change) => {
              stat[change.type] += 1;
              return stat;
            }, stat);
            return stat;
          },
          { insert: 0, delete: 0, normal: 0 },
        ),
      [file],
    );
    const numChanges = React.useMemo<number>(() => {
      return gitStats.insert + gitStats.delete;
    }, [gitStats]);
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
        <div className="flex justify-between items-center top-0 z-10 p-2 sticky bg-card dark:bg-card border select-none shadow-sm text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Button
              className="size-6"
              variant="ghost"
              onClick={() => {
                setIsCollapsed(!isCollapsed);
              }}
            >
              {isCollapsed ? <ChevronDown /> : <ChevronUp />}
            </Button>
            <div className="font-mono">
              {file.oldPath !== file.newPath && `${file.oldPath} → `}
              {file.newPath}
            </div>
            <CopyButton value={file.newPath} tooltip={false} />
          </div>
          <div>
            <GitStatChart
              insertedLines={gitStats.insert}
              deletedLines={gitStats.delete}
              oldSourceNumLines={numOldLines}
            />
          </div>
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
