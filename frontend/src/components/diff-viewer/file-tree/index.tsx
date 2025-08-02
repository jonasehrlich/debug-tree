import React from "react";
import { Input } from "../../ui/input";
import { FileDisplay, FileTreeDisplay } from "./display";
import type { FileTreeProps } from "./types";
import { groupPaths, optimizeFileTree } from "./utils";

export const FileTree = ({ isOpen, paths, onFileClick }: FileTreeProps) => {
  const [filter, setFilter] = React.useState<string>("");
  const [filteredPaths, setFilteredPaths] = React.useState<string[]>(paths);

  React.useEffect(() => {
    const lowerCaseFilter = filter.toLowerCase();
    if (lowerCaseFilter) {
      setFilteredPaths(
        paths.filter((path) => path.toLowerCase().includes(lowerCaseFilter)),
      );
    } else {
      setFilteredPaths(paths);
    }
  }, [paths, filter]);

  // Apply optimization AFTER grouping
  const groupedAndOptimizedTree = React.useMemo(() => {
    const grouped = groupPaths(filteredPaths);
    const t = optimizeFileTree(grouped);
    return { children: t.children ?? {}, files: t.files ?? [] };
  }, [filteredPaths]);

  const handleFilterChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilter(e.target.value);
    },
    [],
  );
  if (!isOpen) {
    return <></>;
  }
  return (
    <div className="flex flex-col shrink-0 border rounded-md w-2xs sm:w-xs lg:w-sm ">
      <div className="border-b p-2">
        <Input
          autoComplete="false"
          placeholder="Filter paths"
          onChange={handleFilterChange}
        />
      </div>
      <div className="flex overflow-auto text-nowrap select-none">
        {Object.keys(groupedAndOptimizedTree.children).length === 0 && (
          <div className="text-muted-foreground p-4 text-sm">
            {filter ? (
              <p> No matching files found.</p>
            ) : (
              <p>No files to display.</p>
            )}
          </div>
        )}

        {
          <ul className="text-sm list-none">
            {Object.keys(groupedAndOptimizedTree.children)
              .sort()
              .map((dirName) => (
                <FileTreeDisplay
                  key={dirName}
                  level={0}
                  tree={groupedAndOptimizedTree.children[dirName]}
                  onFileClick={onFileClick}
                  basePath={dirName}
                />
              ))}
            {groupedAndOptimizedTree.files.sort().map((fileName, idx) => (
              <FileDisplay
                key={idx}
                basePath=""
                fileName={fileName}
                onFileClick={onFileClick}
                level={0}
              />
            ))}
          </ul>
        }
      </div>
    </div>
  );
};
