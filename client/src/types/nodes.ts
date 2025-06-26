import type { Node } from '@xyflow/react';

interface GitMetadata {
    rev: string
}

export type ActionNodeState = "not started" | "in progress" | "done";

export type ActionNode = Node<{
    title: string,
    // state: ActionNodeState,
    description?: string,
    git?: GitMetadata
}, 'actionNode'>

export type StatusNodeState = "unknown" | "fail" | "progress" | "success";

export type StatusNode = Node<{
    title: string,
    // state: StatusNodeState,
    description?: string,
    git?: GitMetadata
}, 'statusNode'>
