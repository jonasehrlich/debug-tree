import { BaseHandle } from "@/components/base-handle";
import { BaseNode } from "@/components/base-node";
import {
  NodeHeader,
  NodeHeaderActions,
  NodeHeaderIcon,
  NodeHeaderMenuAction,
  NodeHeaderTitle,
} from "@/components/node-header";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import {
  type ActionNode as ActionNodeType,
  type StatusNodeState,
  type StatusNode as StatusNodeType,
} from "@/types/nodes";
import type { AppState, EditAppNodeData } from "@/types/state";
import { Position, useReactFlow, type NodeProps } from "@xyflow/react";
import {
  ChartLine,
  EllipsisVertical,
  Pencil,
  Rocket,
  Trash,
} from "lucide-react";
import { memo, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { GitRevision } from "./git-revision";
import { IconSelector } from "./icon-selector";
import {
  statusNodeIconMap,
  statusNodeIconOptions,
  statusNodeStateColorsMap,
} from "./state-colors-icons";
import { DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";

const AppNodeHeaderMenuAction = ({ id, type, data }: EditAppNodeData) => {
  const { setEditNodeData } = useStore(useShallow(selector));
  const { setNodes } = useReactFlow();

  const deleteNode = useCallback(() => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));
  }, [id, setNodes]);

  const ref = useRef<HTMLButtonElement>(null);
  return (
    <NodeHeaderMenuAction
      ref={ref}
      label="App Node Menu"
      trigger={<EllipsisVertical />}
      children={
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={() => {
              setEditNodeData({
                id: id,
                type: type,
                data: data,
              } as EditAppNodeData);
            }}
          >
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={deleteNode}>
            <Trash /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      }
    ></NodeHeaderMenuAction>
  );
};

const selector = (s: AppState) => ({
  setEditNodeData: s.setCurrentEditNodeData,
  addGitRevision: s.addGitRevision,
});

export const ActionNode = memo(
  ({ id, data, selected }: NodeProps<ActionNodeType>) => {
    return (
      <BaseNode selected={selected} className="px-2 pt-2 pb-0 max-w-md">
        <NodeHeader
          className={cn("-mx-2 -mt-2 px-2", data.description && "border-b")}
        >
          <NodeHeaderIcon>
            <Rocket size="16" />
          </NodeHeaderIcon>
          <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
          <NodeHeaderActions>
            <AppNodeHeaderMenuAction id={id} type={"actionNode"} data={data} />
          </NodeHeaderActions>
        </NodeHeader>
        <BaseHandle id="target-1" type="target" position={Position.Left} />
        {data.description && <div className="py-2">{data.description}</div>}
        <BaseHandle id="source-1" type="source" position={Position.Right} />
      </BaseNode>
    );
  },
);

export const StatusNode = memo(
  ({ id, data, selected }: NodeProps<StatusNodeType>) => {
    const { addGitRevision } = useStore(useShallow(selector));
    const { updateNodeData } = useReactFlow();
    return (
      <BaseNode
        selected={selected}
        className={cn(
          "px-2 pt-2 pb-0 max-w-md",
          statusNodeStateColorsMap[data.state].bg,
          statusNodeStateColorsMap[data.state].border,
        )}
      >
        <NodeHeader
          className={cn(
            "-mx-2 -mt-2 px-2",
            data.description || data.git.rev
              ? cn("border-b", statusNodeStateColorsMap[data.state].border)
              : "",
          )}
        >
          <NodeHeaderIcon>
            <ChartLine size="16" />
          </NodeHeaderIcon>
          <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
          <NodeHeaderActions>
            <IconSelector<StatusNodeState>
              selectedIcon={data.state}
              onSelectChange={(newState) => {
                updateNodeData(id, { state: newState });
              }}
              availableIcons={statusNodeIconMap}
              iconChoices={statusNodeIconOptions}
              ariaLabel="Select node state"
            />
            <AppNodeHeaderMenuAction id={id} type={"statusNode"} data={data} />
          </NodeHeaderActions>
        </NodeHeader>
        {data.hasTargetHandle && (
          <BaseHandle id="target-1" type="target" position={Position.Left} />
        )}
        {data.description && <div className="py-2">{data.description}</div>}
        {data.git.rev !== "" && (
          <NodeHeader
            className={cn(
              "-mx-2 px-2",
              data.description
                ? cn("border-t", statusNodeStateColorsMap[data.state].border)
                : "",
            )}
          >
            <GitRevision
              revision={data.git.rev}
              onClickPinRevision={addGitRevision}
            />
          </NodeHeader>
        )}
        <BaseHandle id="source-1" type="source" position={Position.Right} />
      </BaseNode>
    );
  },
);
