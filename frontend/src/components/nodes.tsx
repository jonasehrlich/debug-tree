import { BaseHandle } from "@/components/base-handle";
import { BaseNode } from "@/components/base-node";
import {
  NodeHeader,
  NodeHeaderAction,
  NodeHeaderActions,
  NodeHeaderDeleteAction,
  NodeHeaderIcon,
  NodeHeaderTitle,
} from "@/components/node-header";
import useStore from "@/store";
import {
  type ActionNode as ActionNodeType,
  type StatusNodeState,
  type StatusNode as StatusNodeType,
} from "@/types/nodes";
import { Position, type NodeProps } from "@xyflow/react";
import {
  ChartLine,
  Pencil,
  Rocket,
} from "lucide-react";
import { memo } from "react";
import { GitRevision } from "./git-revision";
import { IconSelector,  } from "./icon-selector";
import { statusNodeIconOptions, statusNodeIconMap } from "./status-icons";

interface NodeHeaderEditActionProps {
  onClick: () => void;
}

export const NodeHeaderEditAction = ({
  onClick,
}: NodeHeaderEditActionProps) => {
  return (
    <NodeHeaderAction
      onClick={onClick}
      variant="ghost"
      label="Edit node"
      className="cursor-pointer"
    >
      <Pencil />
    </NodeHeaderAction>
  );
};

NodeHeaderEditAction.displayName = "NodeHeaderEditAction";

export const ActionNode = memo(
  ({ id, type, data, selected }: NodeProps<ActionNodeType>) => {
    const setEditNodeData = useStore((state) => state.setEditNodeData);
    return (
      <BaseNode selected={selected} className="px-3 py-2 max-w-md">
        <NodeHeader className="-mx-3 -mt-2 border-b">
          <NodeHeaderIcon>
            <Rocket />
          </NodeHeaderIcon>
          <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
          <NodeHeaderActions>
            <NodeHeaderEditAction
              onClick={() => {
                setEditNodeData({ id: id, type: type, data: data });
              }}
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



export const StatusNode = memo(
  ({ id, data, type, selected }: NodeProps<StatusNodeType>) => {
    const updateNodeState = useStore((state) => state.updateStatusNodeState);
    const setEditNodeData = useStore((state) => state.setEditNodeData);

    return (
      <BaseNode selected={selected} className="px-3 py-2 max-w-md">
        <NodeHeader className="-mx-3 -mt-2 border-b">
          <NodeHeaderIcon>
            <ChartLine />
          </NodeHeaderIcon>
          <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
          <NodeHeaderActions>
            <IconSelector<StatusNodeState>
              selectedIcon={data.state}
              onSelectChange={(newState) => {
                updateNodeState(id, newState);
              }}
              availableIcons={statusNodeIconMap}
              iconChoices={statusNodeIconOptions}
              ariaLabel="Select node state"
            />
            <NodeHeaderEditAction
              onClick={() => {
                setEditNodeData({ id: id, type: type, data: data });
              }}
            />
            <NodeHeaderDeleteAction />
          </NodeHeaderActions>
        </NodeHeader>
        <BaseHandle id="target-1" type="target" position={Position.Left} />
        {data.description && <div className="mt-2">{data.description}</div>}
        {data.git.rev !== "" && (
          <NodeHeader className="-mx-3 -mb-2 mt-2 border-t">
            <GitRevision revision={data.git.rev} />
          </NodeHeader>
        )}
        <BaseHandle id="source-1" type="source" position={Position.Right} />
      </BaseNode>
    );
  },
);
