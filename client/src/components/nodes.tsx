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
import { type ActionNode as ActionNodeType } from "@/types/nodes";
import { type NodeProps, Position } from "@xyflow/react";
import { Rocket } from "lucide-react";
import { memo } from "react";


export const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeType>) => {
    return (
        <BaseNode selected={selected} className="px-3 py-2">
            <NodeHeader className="-mx-3 -mt-2 border-b">
                <NodeHeaderIcon>
                    <Rocket />
                </NodeHeaderIcon>
                <NodeHeaderTitle>{data.title}</NodeHeaderTitle>
                <NodeHeaderActions>
                    <NodeHeaderEditAction />
                    <NodeHeaderDeleteAction />
                </NodeHeaderActions>
            </NodeHeader>
            <BaseHandle id="target-1" type="target" position={Position.Left} />
            {data.description && (
                <div className="mt-2">{data.description}</div>)}
            <BaseHandle id="source-1" type="source" position={Position.Right} />
        </BaseNode>
    );
});
