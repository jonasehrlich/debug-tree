import React from "react";
import { SearchInput } from "../icon-input";
import { FileDisplay, TreeDisplay } from "./display";
import type { File, FileTreeProps } from "./types";
import { groupPaths, optimizeFileTree } from "./utils";

export const FileTree = ({ paths, onFileClick }: FileTreeProps) => {
  const [filter, setFilter] = React.useState("");
  const [filteredPaths, setFilteredPaths] = React.useState<File[]>(paths);

  React.useEffect(() => {
    const lowerCaseFilter = filter.toLowerCase();
    if (lowerCaseFilter) {
      setFilteredPaths(
        paths.filter((path) =>
          path.name.toLowerCase().includes(lowerCaseFilter),
        ),
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

  return (
    <div className="flex w-2xs shrink-0 flex-col rounded-md border sm:w-xs lg:w-sm">
      <div className="border-b p-2">
        <SearchInput
          value={filter}
          autoComplete="false"
          placeholder="Filter files..."
          onChange={(e) => {
            setFilter(e.target.value);
          }}
          clearable
        />
      </div>
      <div className="flex overflow-auto py-1 text-nowrap select-none">
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
          <ul className="list-none text-sm">
            {Object.keys(groupedAndOptimizedTree.children)
              .sort()
              .map((dirName) => (
                <TreeDisplay
                  key={dirName}
                  name={dirName}
                  level={0}
                  tree={groupedAndOptimizedTree.children[dirName]}
                  onFileClick={onFileClick}
                  basePath={dirName}
                />
              ))}
            {groupedAndOptimizedTree.files.sort().map((file, idx) => (
              <FileDisplay
                key={idx}
                basePath=""
                fileName={file.name}
                type={file.type}
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
