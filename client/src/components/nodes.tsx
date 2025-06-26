import { BaseHandle } from "@/components/base-handle";
import { BaseNode } from "@/components/base-node";
import {
  NodeHeader,
  NodeHeaderActions,
  NodeHeaderDeleteAction,
  NodeHeaderEditAction,
  NodeHeaderIcon,
  NodeHeaderTitle,
} from "@/components/node-header";
import {
  type ActionNode as ActionNodeType,
  type StatusNodeState,
  type StatusNode as StatusNodeType,
} from "@/types/nodes";
import { type NodeProps, Position } from "@xyflow/react";
import { ChartLine, Rocket } from "lucide-react";
import { memo, useState } from "react";
import { IconSelector, type IconOptions, type IconMap } from "./icon-selector";

import { CircleCheck, CircleQuestionMark, Ban, TrendingUp } from "lucide-react";

export const ActionNode = memo(
  ({ data, selected }: NodeProps<ActionNodeType>) => {
    return (
      <BaseNode selected={selected} className="px-3 py-2 max-w-md">
        <NodeHeader className="-mx-3 -mt-2 border-b">
          <NodeHeaderIcon>
            <Rocket />
          </NodeHeaderIcon>
          <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
          <NodeHeaderActions>
            <NodeHeaderDeleteAction />
            <NodeHeaderEditAction />
          </NodeHeaderActions>
        </NodeHeader>
        <BaseHandle id="target-1" type="target" position={Position.Left} />
        {data.description && <div className="mt-2">{data.description}</div>}

        <BaseHandle id="source-1" type="source" position={Position.Right} />
      </BaseNode>
    );
  },
);

// Map status note states to labels
const statusNodeIconOptions: IconOptions<StatusNodeState> = [
  { value: "unknown", label: "Unknown" },
  { value: "progress", label: "Progress" },
  { value: "fail", label: "Fail" },
  { value: "success", label: "Success" },
];

// Map status note states to icons
const statusNodeIconMap: IconMap<StatusNodeState> = {
  unknown: (
    <CircleQuestionMark
      size={16}
      className="stroke-gray-400 dark:stroke-gray-300"
    />
  ),
  progress: <TrendingUp size={16} className="stroke-amber-400" />,
  fail: <Ban size={16} className="stroke-red-500" />,
  success: <CircleCheck size={16} className="stroke-green-500" />,
};

export const StatusNode = memo(
  ({ data, selected }: NodeProps<StatusNodeType>) => {
    const [state, setState] = useState<StatusNodeState>(data.state);
    const handleIconChange = (newIconKey: StatusNodeState) => {
      setState(newIconKey);
      // Call the parent callback or set the node status using the API
    };

    return (
      <BaseNode selected={selected} className="px-3 py-2 max-w-md">
        <NodeHeader className="-mx-3 -mt-2 border-b">
          <NodeHeaderIcon>
            <ChartLine />
          </NodeHeaderIcon>
          <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
          <NodeHeaderActions>
            <IconSelector
              selectedIcon={state}
              onSelectChange={handleIconChange}
              availableIcons={statusNodeIconMap}
              iconChoices={statusNodeIconOptions}
              ariaLabel="Select node state"
            />
            <NodeHeaderDeleteAction />
          </NodeHeaderActions>
        </NodeHeader>
        <BaseHandle id="target-1" type="target" position={Position.Left} />
        {data.description && <div className="mt-2">{data.description}</div>}

        <BaseHandle id="source-1" type="source" position={Position.Right} />
      </BaseNode>
    );
  },
);
