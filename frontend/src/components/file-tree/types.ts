export type FileType =
  | "add"
  | "delete"
  | "modify"
  | "rename"
  | "copy"
  | "unknown";

export interface File {
  name: string;
  type: FileType;
}

export interface FileTreeData {
  children?: Record<string, FileTreeData>;
  files?: File[];
}

export interface FileTreeProps {
  paths: File[];
  onFileClick: (filePath: string) => void;
}

export interface FileTreeDisplayProps {
  name: string;
  tree?: FileTreeData;
  onFileClick: (filePath: string) => void;
  basePath: string;
  level: number;
}

export interface FileDisplayProps {
  /** Name of the file */
  fileName: string;
  /** Type of the file */
  type: FileType;
  /**
   * Callback when a file is clicked
   * @param filePath Path to the file that was clicked
   */
  onFileClick: (filePath: string) => void;
  basePath: string;
  /** Level of the displayed component in the tree */
  level: number;
}
