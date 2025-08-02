export interface FileTreeData {
  children?: Record<string, FileTreeData>;
  files?: string[];
}

export interface FileTreeProps {
  isOpen: boolean;
  paths: string[];
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
  onFileClick: (filePath: string) => void;
  basePath: string;
  level: number;
}
