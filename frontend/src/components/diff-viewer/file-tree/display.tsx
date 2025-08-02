import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import React, { useState } from "react";
import type { FileDisplayProps, FileTreeDisplayProps } from "./types";

export const FileTreeDisplay = ({
  tree,
  onFileClick,
  basePath,
  level,
}: FileTreeDisplayProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // Manually calculate the left padding for the tree header
  const levelDependentStyles = React.useMemo(
    () => ({ paddingLeft: `${(level + 0.5).toString()}rem` }),
    [level],
  );
  if (!tree) {
    return null;
  }

  // Sort directories and files for consistent order
  const directories = tree.children ? Object.keys(tree.children).sort() : [];
  const files = tree.files ? [...tree.files].sort() : [];

  return (
    // For the very top level, we might just render its children directly
    // or wrap them in an implied <ul> from the parent.
    // For sub-levels, each call to FileTreeDisplay represents a list item.
    <li>
      {
        // Only render header for non-root directories
        <div
          className="flex items-center gap-1 py-1 rounded-md hover:bg-muted pr-2"
          onClick={toggleOpen}
        >
          <div
            className="flex gap-1 shrink-0 text-muted-foreground/50  "
            style={levelDependentStyles}
          >
            <span>
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
            <Folder size={16} className="fill-current" />
          </div>
          {basePath}
        </div>
      }

      {
        /* Children of the current node if open */
        isOpen && (
          <ul className="" key={basePath}>
            {directories.map((dirName) => (
              <FileTreeDisplay
                level={level + 1}
                key={dirName}
                tree={tree.children?.[dirName]}
                onFileClick={onFileClick}
                basePath={`${basePath}/${dirName}`}
              />
            ))}
            {files.map((fileName) => (
              <FileDisplay
                fileName={fileName}
                level={level + 1}
                basePath={basePath}
                onFileClick={onFileClick}
              />
            ))}
          </ul>
        )
      }
    </li>
  );
};

export const FileDisplay = ({
  fileName,
  basePath,
  onFileClick,
  level,
}: FileDisplayProps) => {
  // Manually calculate the left padding for the files
  const levelDependentStyles = React.useMemo(
    () => ({ paddingLeft: `${(level + 1.75).toString()}rem` }),
    [level],
  );
  return (
    <li
      key={fileName}
      className="py-1 rounded-md hover:bg-muted pr-2"
      onClick={() => {
        onFileClick(`${basePath ? basePath + "/" : ""}${fileName}`);
      }}
    >
      <div className="flex items-center gap-1  " style={levelDependentStyles}>
        <File
          size={16}
          className="stroke-muted-foreground/60 stroke-muted-foreground shrink-0"
        />
        {
          // TODO: add metadata to the file for edit / create / delete
          fileName
        }
      </div>
    </li>
  );
};
