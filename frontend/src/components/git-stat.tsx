import { cn } from "@/lib/utils";
import React from "react";

interface GitStatProps {
  /** Number of inserted lines */
  insertedLines: number;
  /** Number of deleted lines */
  deletedLines: number;
  /** Props for the inserted lines span */
  insertedProps?: React.ComponentProps<"span">;
  /** Props for the deleted lines span */
  deletedProps?: React.ComponentProps<"span">;
}

/**
 * Color inserted and deleted lines to show a Git stat
 */
export const GitStat = ({
  insertedLines,
  deletedLines,
  insertedProps,
  deletedProps,
}: GitStatProps) => {
  return (
    <>
      {insertedLines !== 0 && (
        <span className="text-emerald-600 font-semibold" {...insertedProps}>
          +{insertedLines}
        </span>
      )}
      {deletedLines !== 0 && (
        <span
          className="text-red-600 dark:text-red-800 font-semibold"
          {...deletedProps}
        >
          -{deletedLines}
        </span>
      )}
    </>
  );
};

interface GitStatChartProps {
  /** Number of total lines in the old version of the file */
  oldSourceNumLines: number;
}

const numSegments = 5 as const;

/**
 * Displays a {@link GitStat} with a chart showing the amount of inserted and deleted compared to
 * a total quantity.
 */
export const GitStatChart = React.memo(
  ({
    insertedLines,
    deletedLines,
    oldSourceNumLines,
  }: GitStatChartProps & GitStatProps) => {
    // Prevent division by zero and handle the case with no lines.
    const hasLines = oldSourceNumLines > 0;

    // Calculate the number of segments for each color, ceiling to the nearest whole number.
    const numGreenSegments = hasLines
      ? Math.ceil((insertedLines / oldSourceNumLines) * numSegments)
      : // The file had zero lines, so it was created
        numSegments;
    const numRedSegments = hasLines
      ? Math.ceil((deletedLines / oldSourceNumLines) * numSegments)
      : // Can't really delete lines from an empty file
        0;

    // Create an array of segments and assign colors.
    // Green is prioritized, then red. The rest are neutral.
    const segments = Array.from({ length: numSegments }, (_, i) => {
      if (i < numGreenSegments) {
        return "bg-emerald-600";
      }
      if (i < numGreenSegments + numRedSegments) {
        return "bg-red-600 dark:bg-red-800";
      }
      return "bg-zinc-400 dark:bg-zinc-600";
    });

    return (
      <div className="flex space-x-1 items-center">
        <GitStat insertedLines={insertedLines} deletedLines={deletedLines} />
        <div className="flex w-full gap-1" role="img">
          {segments.map((colorClass, index) => (
            <div
              key={index}
              className={cn("h-full flex-1 size-2 rounded-xs", colorClass)}
            />
          ))}
        </div>
      </div>
    );
  },
);
