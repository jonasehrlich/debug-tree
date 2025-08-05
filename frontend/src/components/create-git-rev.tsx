import log from "loglevel";
import { GitBranch, Tag } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  branchDisabled?: boolean;
  tagDisabled?: boolean;
  onSubmit: (type: "branch" | "tag", name: string) => Promise<void>;
}

export const CreateGitRevisionInput: React.FC<Props> = ({
  branchDisabled,
  tagDisabled,
  onSubmit,
}) => {
  const [creatingType, setCreatingType] = useState<"branch" | "tag" | null>(
    null,
  );
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = async () => {
    if (!inputValue.trim() || !creatingType) return;
    await onSubmit(creatingType, inputValue.trim());
    setCreatingType(null);
    setInputValue("");
  };

  const cancel = () => {
    setCreatingType(null);
    setInputValue("");
  };

  const logger = log.getLogger("create-git-rev-input");

  return (
    <div className="flex flex-col gap-2">
      {!creatingType ? (
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={branchDisabled}
                onClick={() => {
                  setCreatingType("branch");
                }}
              >
                <GitBranch size={16} /> New Branch
              </Button>
            </TooltipTrigger>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={tagDisabled}
                onClick={() => {
                  setCreatingType("tag");
                }}
              >
                <Tag size={16} /> New Tag
              </Button>
            </TooltipTrigger>
          </Tooltip>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            placeholder={`Enter ${creatingType} name`}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            className="w-[200px]"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              handleSubmit()
                .then()
                .catch((error: unknown) => {
                  logger.error("Error creating git revision:", error);
                });
            }}
            disabled={!inputValue.trim()}
          >
            Create
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={cancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
