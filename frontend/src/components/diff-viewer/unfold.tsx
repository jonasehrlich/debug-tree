import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronsDown,
  ChevronsDownUp,
  ChevronsUp,
  ChevronUp,
} from "lucide-react";
import React from "react";
import {
  Decoration,
  getCollapsedLinesCountBetween,
  type DecorationProps,
  type HunkData,
} from "react-diff-view";
import { Tooltip } from "../ui/tooltip";

const ICON_TYPE_MAPPING = {
  up: <ChevronUp size={18} />,
  down: <ChevronDown size={18} />,
  allBetween: <ChevronsDownUp size={18} />,
  upToStart: <ChevronsUp size={18} />,
  downToEnd: <ChevronsDown size={18} />,
};

interface UnfoldDecorationProps
  extends Omit<
    DecorationProps,
    "children" | "gutterClassName" | "contentClassName"
  > {
  startLine: number;
  endLine: number;
  direction: "up" | "down" | "allBetween" | "upToStart" | "downToEnd";
  onExpand: (start: number, end: number) => void;
}

const UnfoldDecoration = ({
  startLine,
  endLine,
  direction,
  onExpand,
  ...props
}: UnfoldDecorationProps) => {
  const expand = React.useCallback(() => {
    onExpand(startLine, endLine);
  }, [onExpand, startLine, endLine]);

  const iconType = ICON_TYPE_MAPPING[direction];
  const lines = endLine - startLine;
  const tooltipText =
    direction === "down" || direction === "up"
      ? `Expand ${direction}`
      : `Expand ${lines.toString()} lines`;
  return (
    <Decoration
      gutterClassName="diff-decoration-gutter-unfold"
      contentClassName="diff-decoration-content-unfold"
      {...props}
      className={cn(
        props.className,
        "text-muted-foreground items-center font-sans",
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={expand}
            className="flex h-full cursor-pointer items-center justify-center bg-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-700"
          >
            {iconType}
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
      <div className="bg-blue-100/40 px-2 font-sans dark:bg-blue-950/40">
        &nbsp;
      </div>
    </Decoration>
  );
};

interface UnfoldHunksInFileProps {
  previousHunk: HunkData;
  currentHunk: HunkData;
}

interface UnfoldHunksFileEndProps {
  previousHunk: HunkData;
  currentHunk?: undefined;
}
interface UnfoldHunksFileStartProps {
  previousHunk?: undefined;
  currentHunk: HunkData;
}

type UnfoldHunksProps =
  | UnfoldHunksInFileProps
  | UnfoldHunksFileEndProps
  | UnfoldHunksFileStartProps;

interface UnfoldProps {
  linesCount: number;
  onExpand: (start: number, end: number) => void;
}

export const Unfold = ({
  previousHunk,
  currentHunk,
  linesCount,
  onExpand,
}: UnfoldProps & UnfoldHunksProps) => {
  if (!currentHunk) {
    // End of file
    const nextStart = previousHunk.oldStart + previousHunk.oldLines;
    const collapsedLines = linesCount - nextStart + 1;

    if (collapsedLines <= 0) {
      return null;
    }

    return (
      <>
        {collapsedLines > 10 && (
          <UnfoldDecoration
            direction="down"
            startLine={nextStart}
            endLine={nextStart + 10}
            onExpand={onExpand}
          />
        )}
        <UnfoldDecoration
          direction="downToEnd"
          startLine={nextStart}
          endLine={linesCount + 1}
          onExpand={onExpand}
        />
      </>
    );
  }

  const collapsedLines = getCollapsedLinesCountBetween(
    previousHunk ?? null,
    currentHunk,
  );

  if (!previousHunk) {
    // Start of file
    if (!collapsedLines) {
      return null;
    }

    const start = Math.max(currentHunk.oldStart - 10, 1);

    return (
      <>
        <UnfoldDecoration
          direction="upToStart"
          startLine={1}
          endLine={currentHunk.oldStart}
          onExpand={onExpand}
        />
        {collapsedLines > 10 && (
          <UnfoldDecoration
            direction="up"
            startLine={start}
            endLine={currentHunk.oldStart}
            onExpand={onExpand}
          />
        )}
      </>
    );
  }

  const collapsedStart = previousHunk.oldStart + previousHunk.oldLines;
  const collapsedEnd = currentHunk.oldStart;

  if (collapsedLines < 10) {
    // In the middle but less than 10 lines are folded
    return (
      <UnfoldDecoration
        direction="allBetween"
        startLine={collapsedStart}
        endLine={collapsedEnd}
        onExpand={onExpand}
      />
    );
  }

  return (
    <>
      <UnfoldDecoration
        direction="down"
        startLine={collapsedStart}
        endLine={collapsedStart + 10}
        onExpand={onExpand}
      />
      <UnfoldDecoration
        direction="allBetween"
        startLine={collapsedStart}
        endLine={collapsedEnd}
        onExpand={onExpand}
      />
      <UnfoldDecoration
        direction="up"
        startLine={collapsedEnd - 10}
        endLine={collapsedEnd}
        onExpand={onExpand}
      />
    </>
  );
};
