import { GitBranch } from "lucide-react";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

/**
 * @interface GitRevisionProps
 * @description Props for the GitRevisionProps component.
 * @property {string} revision - The text string to be copied to the clipboard.
 */
interface GitRevisionProps {
  revision: string;
}

export const GitRevision = ({ revision }: GitRevisionProps) => {
  const textColorClass = "text-gray-800 dark:text-gray-300";
  return (
    <div className={cn("flex flex-1 items-center", textColorClass)}>
      <GitBranch size={20}  />
      <span className="flex-1 text-gray-800 dark:text-gray-300 font-mono px-3 py-1 truncate align-middle">
        {revision}
      </span>
      <CopyButton text={revision} contentName="revision"/>
    </div>
  );
};
