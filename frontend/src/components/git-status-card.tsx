import { isBranchMetadata, type GitStatus } from "@/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatGitRevision } from "@/types/nodes";

interface GitStatusCardProps {
  status: GitStatus;
  footer?: (status: GitStatus) => React.ReactNode;
}

export function GitStatusCard({ status, footer }: GitStatusCardProps) {
  const { revision } = status;
  const isDetached = !isBranchMetadata(revision);

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Git Status</CardTitle>
        <Badge variant={isDetached ? "destructive" : "default"}>
          {isDetached ? "Detached HEAD" : "On Branch"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1">
        <div>
          <div className="truncate font-semibold text-sm max-w-full overflow-hidden whitespace-nowrap">
            {formatGitRevision(revision)}
          </div>
        </div>
        <div className="text-muted-foreground text-sm">{revision.summary}</div>
      </CardContent>
      {footer && (
        <CardFooter className="flex gap-2">{footer(status)}</CardFooter>
      )}
    </Card>
  );
}
