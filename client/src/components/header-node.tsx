import { memo } from "react";

import { type NodeProps, Position } from "@xyflow/react";

import { BaseHandle } from "@/components/base-handle";
import { BaseNode } from "@/components/base-node";
import {
    NodeHeader,
    NodeHeaderTitle,
    NodeHeaderActions,
    NodeHeaderIcon,
    NodeHeaderDeleteAction,
} from "@/components/node-header";
import { Rocket } from "lucide-react";

const ActionNode = memo(({ selected }: NodeProps) => {
    return (
        <BaseNode selected={selected} className="px-3 py-2">
            <NodeHeader className="-mx-3 -mt-2 border-b">
                <NodeHeaderIcon>
                    <Rocket />
                </NodeHeaderIcon>
                <NodeHeaderTitle>Node title</NodeHeaderTitle>
                <NodeHeaderActions>
                    <NodeHeaderDeleteAction />
                </NodeHeaderActions>
            </NodeHeader>
            <BaseHandle id="target-1" type="target" position={Position.Left} />
            <div className="mt-2">Note body</div>
            <BaseHandle id="source-1" type="source" position={Position.Right} />
        </BaseNode>
    );
});


export default ActionNode;
