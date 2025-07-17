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
import {
  Position,
  useReactFlow,
  useStore as useReactFlowStore,
  type NodeProps,
  type ReactFlowState,
} from "@xyflow/react";
import {
  ChartLine,
  EllipsisVertical,
  Pencil,
  Rocket,
  Trash,
} from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { GitRevision } from "./git-revision";
import { IconSelect } from "./icon-select";
import {
  statusNodeStateClasses,
  statusNodeStateIconConfig,
} from "./state-colors-icons";
import { DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

const AppNodeHeaderMenuAction = ({
  id,
  type,
  data,
  deletable = true,
}: EditAppNodeData & { deletable?: boolean }) => {
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
          {deletable && (
            <DropdownMenuItem onSelect={deleteNode}>
              <Trash /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      }
    ></NodeHeaderMenuAction>
  );
};

const selector = (s: AppState) => ({
  setEditNodeData: s.setCurrentEditNodeData,
  addGitRevision: s.addGitRevision,
});

const zoomSelector = (s: ReactFlowState) => s.transform[2] >= 0.6;

interface PlaceholderProps {
  numLines?: number;
}

const HeaderPlaceholder = ({ numLines = 1 }: PlaceholderProps) => (
  <header
    className={cn(
      "flex items-center gap-2 px-3 py-2 pb-3",
      // nodeHeaderAdditionalClasses,
    )}
  >
    <Skeleton className="h-6 w-6 rounded-full animate-none" />
    <div className="space-y-2">
      {Array.from({ length: numLines }, (_, i) => (
        <Skeleton key={i} className="h-4 w-[200px] animate-none" />
      ))}
    </div>
  </header>
);

const PlaceholderNodeContent = ({
  numDescriptionLines = 0,
}: {
  numDescriptionLines?: number;
}) => (
  <div className="items-center  px-4 pt-2 space-y-2">
    {Array.from({ length: numDescriptionLines }, (_, i) => (
      <Skeleton key={i} className="h-4 w-[265px] animate-none" />
    ))}
  </div>
);

const nodeHeaderAdditionalClasses = "-mx-2 -mt-2 px-2";

export const ActionNode = memo(
  ({ id, data, selected }: NodeProps<ActionNodeType>) => {
    const [handleIds] = useState(() => {
      return { target: `target-${id}`, source: `source-${id}` };
    });

    const showContent = useReactFlowStore(zoomSelector);

    return (
      <BaseNode selected={selected} className="px-2 pt-2 pb-0 w-xs">
        {showContent ? (
          <>
            <NodeHeader
              className={cn(
                nodeHeaderAdditionalClasses,
                data.description && "border-b",
              )}
            >
              <NodeHeaderIcon>
                <Rocket size="16" />
              </NodeHeaderIcon>

              <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
              <NodeHeaderActions>
                <AppNodeHeaderMenuAction
                  id={id}
                  type={"actionNode"}
                  data={data}
                />
              </NodeHeaderActions>
            </NodeHeader>
          </>
        ) : (
          <HeaderPlaceholder numLines={2} />
        )}
        {data.description && <div className="py-2">{data.description}</div>}
        <BaseHandle
          id={handleIds.target}
          type="target"
          position={Position.Left}
        />
        <BaseHandle
          id={handleIds.source}
          type="source"
          position={Position.Right}
        />
      </BaseNode>
    );
  },
);

ActionNode.displayName = "ActionNode";

export const StatusNode = memo(
  ({ id, data, selected }: NodeProps<StatusNodeType>) => {
    const { addGitRevision } = useStore(useShallow(selector));
    const { updateNodeData } = useReactFlow();

    const handleIds = useMemo(() => {
      return {
        target: `target-${id}`,
        source: `source-${id}`,
      };
    }, [id]);
    return (
      <BaseNode
        selected={selected}
        className={cn(
          "px-2 pt-2 pb-0 w-xs",
          statusNodeStateClasses[data.state].bg,
          statusNodeStateClasses[data.state].border,
        )}
      >
        <NodeHeader
          className={cn(
            nodeHeaderAdditionalClasses,
            data.description || data.git
              ? cn("border-b", statusNodeStateClasses[data.state].border)
              : "",
          )}
        >
          <NodeHeaderIcon>
            <ChartLine size="16" />
          </NodeHeaderIcon>
          <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
          <NodeHeaderActions>
            <IconSelect<StatusNodeState>
              selectedIcon={data.state}
              onSelectChange={(newState) => {
                updateNodeData(id, { state: newState });
              }}
              optionsAndIcons={statusNodeStateIconConfig}
              ariaLabel="Select node state"
            />
            <AppNodeHeaderMenuAction
              id={id}
              type={"statusNode"}
              data={data}
              deletable={!data.isRootNode}
            />
          </NodeHeaderActions>
        </NodeHeader>
        {!data.isRootNode && (
          <BaseHandle
            id={handleIds.target}
            type="target"
            position={Position.Left}
          />
        )}
        {data.description && <div className="py-2">{data.description}</div>}
        {data.git && (
          <NodeHeader
            className={cn(
              "-mx-2 px-2",
              data.description
                ? cn("border-t", statusNodeStateClasses[data.state].border)
                : "",
            )}
          >
            <GitRevision
              revision={data.git}
              onClickPinRevision={addGitRevision}
            />
          </NodeHeader>
        )}
        <BaseHandle
          id={handleIds.source}
          type="source"
          position={Position.Right}
        />
      </BaseNode>
    );
  },
);

StatusNode.displayName = "StatusNode";
