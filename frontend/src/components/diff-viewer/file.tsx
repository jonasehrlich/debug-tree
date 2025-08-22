import { CopyButton } from "@/components/action-button";
import { GitStatsChart } from "@/components/git-stats";
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
type GitStats = Record<ChangeType, number> & { oldSourceNumLines: number };

const formatDiffFilePaths = (file: FileData) => {
  const modified = file.newPath === file.oldPath;
  if (modified) {
    return file.oldPath;
  }
  if (file.type === "add") {
    // File was created
    return file.newPath;
  }
  if (file.type === "delete") {
    // File was deleted
    return file.oldPath;
  }
  return `${file.oldPath} → ${file.newPath}`;
};

const DiffFileHeader = ({
  file,
  stats,
  isDiffOpen,
  setIsDiffOpen,
}: {
  file: FileData;
  stats: GitStats;
  isDiffOpen: boolean;
  setIsDiffOpen: (c: boolean) => void;
}) => {
  return (
    <div className="bg-card dark:bg-card text-muted-foreground sticky top-0 z-10 flex items-center justify-between p-2 text-xs shadow-sm select-none">
      <div className="flex items-center space-x-2">
        <Button
          className="size-6"
          variant="ghost"
          onClick={() => {
            setIsDiffOpen(!isDiffOpen);
          }}
        >
          {isDiffOpen ? <ChevronUp /> : <ChevronDown />}
        </Button>
        <div className="font-mono">{formatDiffFilePaths(file)}</div>
        <CopyButton value={file.newPath} tooltip={false} />
      </div>
      {file.type !== "rename" && (
        // No need to display the Git stats for a file that was renamed
        <div>
          <GitStatsChart
            insertedLines={stats.insert}
            deletedLines={stats.delete}
            oldSourceNumLines={stats.oldSourceNumLines}
          />
        </div>
      )}
    </div>
  );
};

export const DiffFile = React.memo(
  ({
    ref,
    file,
    oldSource,
    ...diffProps
  }: {
    ref?: React.Ref<HTMLDivElement>;
    file: FileData;
    oldSource: string;
  } & Omit<DiffProps, "hunks" | "diffType">) => {
    const gitStats = React.useMemo<GitStats>(() => {
      const numOldLines = oldSource ? oldSource.split("\n").length : 0;
      const s = {
        insert: 0,
        delete: 0,
        normal: 0,
        oldSourceNumLines: numOldLines,
      };
      return file.hunks.reduce((stat, hunk) => {
        stat = hunk.changes.reduce((stat, change) => {
          stat[change.type] += 1;
          return stat;
        }, stat);
        return stat;
      }, s);
    }, [file, oldSource]);

    const numChanges = React.useMemo<number>(() => {
      return gitStats.insert + gitStats.delete;
    }, [gitStats]);
    const [renderDiff, setRenderDiff] = React.useState(numChanges < 1000);
    const [isDiffOpen, setIsDiffOpen] = React.useState(true);
    const [hunks, expandRange] = useSourceExpansion(file.hunks, oldSource);

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
          linesCount={gitStats.oldSourceNumLines}
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
            linesCount={gitStats.oldSourceNumLines}
            onExpand={expandRange}
          />
        );
        children.push(unfoldTailElement);
      }

      return children;
    };

    return (
      <div
        ref={ref}
        className="divide-y overflow-hidden rounded-md border text-xs"
      >
        <DiffFileHeader
          file={file}
          isDiffOpen={isDiffOpen}
          setIsDiffOpen={setIsDiffOpen}
          stats={gitStats}
        />
        {isDiffOpen &&
          (renderDiff ? (
            file.type === "rename" ? (
              <div className="text-muted-foreground flex justify-center p-4 text-sm">
                File was renamed without changes
              </div>
            ) : (
              <Diff diffType={file.type} hunks={hunks} {...diffProps}>
                {(hunks) => hunks.reduce(renderHunk, [])}
              </Diff>
            )
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center space-y-4 p-4 text-sm">
              <div>This diff is large, load it manually.</div>
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
      </div>
    );
  },
);
