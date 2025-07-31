import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import {
  Diff,
  type DiffProps,
  type FileData,
  Hunk,
  parseDiff,
} from "react-diff-view";
import { Button } from "./ui/button";

const DiffFile = ({
  file,
  ...diffProps
}: { file: FileData } & Omit<DiffProps, "hunks" | "diffType">) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  return (
    <>
      <div className=" flex justify-between items-center top-0 z-10 p-2 font-mono sticky bg-muted border-t dark:border-b shadow-sm text-sm text-muted-foreground">
        <div>
          {file.oldPath !== file.newPath && `${file.oldPath} → `}
          {file.newPath}
        </div>
        <Button
          className="size-6"
          variant="ghost"
          onClick={() => {
            setIsCollapsed(!isCollapsed);
          }}
        >
          {isCollapsed ? <ChevronDown /> : <ChevronUp />}{" "}
        </Button>
      </div>
      {!isCollapsed && (
        <Diff diffType={file.type} hunks={file.hunks} {...diffProps}>
          {(hunks) =>
            hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
          }
        </Diff>
      )}
    </>
  );
};

export const DiffViewer = ({ patch }: { patch: string }) => {
  const files = parseDiff(patch);

  if (!files.length) {
    return <div>No diff available</div>;
  }

  return (
    <div>
      {files.map((file, idx) => (
        <div key={idx} className="mb-4 border">
          <DiffFile file={file} viewType="unified" className="text-xs" />
        </div>
      ))}
    </div>
  );
};
