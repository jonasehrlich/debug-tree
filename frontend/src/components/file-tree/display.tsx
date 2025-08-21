import {
  ChevronDown,
  ChevronRight,
  File,
  FileDiff,
  FileInput,
  FileMinus,
  FilePlus,
  FileStack,
  Folder,
  FolderOpen,
} from "lucide-react";
import React, { useState } from "react";
import type { FileDisplayProps, FileTreeDisplayProps, FileType } from "./types";

export const TreeDisplay = ({
  name,
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
          className="hover:bg-muted flex items-center gap-1 rounded-md py-1 pr-2"
          onClick={toggleOpen}
        >
          <div
            className="flex shrink-0 gap-1 stroke-zinc-400"
            style={levelDependentStyles}
          >
            {isOpen ? (
              <>
                <ChevronDown size={16} className="stroke-zinc-400" />
                <FolderOpen size={16} className="stroke-zinc-400" />
              </>
            ) : (
              <>
                <ChevronRight size={16} className="stroke-zinc-400" />
                <Folder size={16} className="stroke-zinc-400" />
              </>
            )}
          </div>
          {name}
        </div>
      }

      {
        /* Children of the current node if open */
        isOpen && (
          <ul key={basePath}>
            {directories.map((dirName, idx) => (
              <TreeDisplay
                key={idx}
                level={level + 1}
                name={dirName}
                tree={tree.children?.[dirName]}
                onFileClick={onFileClick}
                basePath={`${basePath}/${dirName}`}
              />
            ))}
            {files.map((file, idx) => (
              <FileDisplay
                key={idx}
                fileName={file.name}
                type={file.type}
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

const FILE_ICON_MAP: Record<FileType, React.ReactElement> = {
  add: <FilePlus size={16} className="shrink-0 stroke-emerald-600" />,
  copy: <FileStack size={16} className="shrink-0 stroke-amber-400" />,
  delete: <FileMinus size={16} className="shrink-0 text-red-600" />,
  modify: <FileDiff size={16} className="shrink-0 stroke-zinc-400" />,
  rename: <FileInput size={16} className="shrink-0 stroke-amber-400" />,
  unknown: <File size={16} className="shrink-0 stroke-zinc-400" />,
} as const;

export const FileDisplay = ({
  fileName,
  basePath,
  onFileClick,
  level,
  type,
}: FileDisplayProps) => {
  // Manually calculate the left padding for the files
  const levelDependentStyles = React.useMemo(
    () => ({ paddingLeft: `${(level + 1.75).toString()}rem` }),
    [level],
  );
  return (
    <li
      className="hover:bg-muted rounded-md py-1 pr-2"
      onClick={() => {
        onFileClick(`${basePath ? basePath + "/" : ""}${fileName}`);
      }}
    >
      <div className="flex items-center gap-1" style={levelDependentStyles}>
        {FILE_ICON_MAP[type]}
        {fileName}
      </div>
    </li>
  );
};
