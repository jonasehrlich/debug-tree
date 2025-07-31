import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronsDownUp, ChevronUp } from "lucide-react";
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
  none: <ChevronsDownUp size={18} />,
};

interface UnfoldDecorationProps
  extends Omit<
    DecorationProps,
    "children" | "gutterClassName" | "contentClassName"
  > {
  startLine: number;
  endLine: number;
  direction: "up" | "down" | "none";
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
    direction === "none" ? `Expand ${lines} lines` : `Expand ${direction}`;
  return (
    <Decoration
      gutterClassName="diff-decoration-gutter-unfold"
      contentClassName="diff-decoration-content-unfold"
      {...props}
      className={cn(
        props.className,
        "text-muted-foreground font-sans items-center",
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={expand}
            className="flex items-center justify-center h-full cursor-pointer dark:bg-blue-950 dark:hover:bg-blue-700 bg-blue-200 hover:bg-blue-100"
          >
            {iconType}
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
      <div className="px-2 dark:bg-blue-950/40 bg-blue-100/40 font-sans">
        &nbsp;
      </div>
    </Decoration>
  );
};

interface UnfoldHunksPreviousAndCurrent {
  previousHunk: HunkData;
  currentHunk: HunkData;
}

interface UnfoldHunksPreviousNoCurrent {
  previousHunk: HunkData;
  currentHunk?: undefined;
}
interface UnfoldHunksNoPreviousCurrent {
  previousHunk?: undefined;
  currentHunk: HunkData;
}

type UnfoldHunksProps =
  | UnfoldHunksPreviousAndCurrent
  | UnfoldHunksPreviousNoCurrent
  | UnfoldHunksNoPreviousCurrent;

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
          direction="down"
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
    if (!collapsedLines) {
      return null;
    }

    const start = Math.max(currentHunk.oldStart - 10, 1);

    return (
      <>
        <UnfoldDecoration
          direction="up"
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
    return (
      <UnfoldDecoration
        direction="none"
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
        direction="none"
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
