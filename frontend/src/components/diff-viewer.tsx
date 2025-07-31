import { Diff, Hunk, parseDiff } from "react-diff-view";

export const DiffViewer = ({ patch }: { patch: string }) => {
  const files = parseDiff(patch);

  if (!files.length) {
    return <div>No diff available</div>;
  }

  return (
    <div>
      {files.map((file, fileIndex) => (
        <div key={fileIndex} className="mb-6 border">
          <div className="font-mono sticky top-0 z-10 p-2 bg-background border-t shadow-sm text-sm text-muted-foreground">
            {file.oldPath} → {file.newPath}
          </div>
          <Diff
            viewType="unified" // or "split"
            diffType={file.type}
            hunks={file.hunks}
            className="text-xs"
          >
            {(hunks) =>
              hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
            }
          </Diff>
        </div>
      ))}
    </div>
  );
};
