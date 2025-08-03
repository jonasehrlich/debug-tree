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
  fileName: string;
  type: FileType;
  onFileClick: (filePath: string) => void;
  basePath: string;
  level: number;
}
