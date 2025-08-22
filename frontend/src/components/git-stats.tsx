import { cn } from "@/lib/utils";
import React from "react";

interface GitStatsProps {
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
export const GitStats = ({
  insertedLines,
  deletedLines,
  insertedProps,
  deletedProps,
}: GitStatsProps) => {
  return (
    <>
      {insertedLines !== 0 && (
        <span
          className="font-semibold text-emerald-600 select-none"
          {...insertedProps}
        >
          +{insertedLines}
        </span>
      )}
      {deletedLines !== 0 && (
        <span
          className="font-semibold text-red-600 select-none dark:text-red-800"
          {...deletedProps}
        >
          -{deletedLines}
        </span>
      )}
    </>
  );
};

interface GitStatsChartProps {
  /** Number of total lines in the old version of the file */
  oldSourceNumLines: number;
}

const numSegments = 5 as const;

/**
 * Displays a {@link GitStats} with a chart showing the amount of inserted and deleted compared to
 * a total quantity.
 */
export const GitStatsChart = React.memo(
  ({
    insertedLines,
    deletedLines,
    oldSourceNumLines,
    ...props
  }: GitStatsChartProps & GitStatsProps & React.ComponentProps<"div">) => {
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
      <div
        {...props}
        className={cn("flex items-center space-x-1", props.className)}
      >
        <GitStats insertedLines={insertedLines} deletedLines={deletedLines} />
        <div className="flex w-full gap-1" role="img">
          {segments.map((colorClass, index) => (
            <div
              key={index}
              className={cn("size-2 h-full flex-1 rounded-xs", colorClass)}
            />
          ))}
        </div>
      </div>
    );
  },
);
