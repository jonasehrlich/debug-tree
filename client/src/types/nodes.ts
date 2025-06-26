import type { Node } from '@xyflow/react';

interface GitMetadata {
    rev: string
}

export type ActionNode = Node<{
    title: string,
    description?: string,
}, 'actionNode'>

export type StatusNodeState = "unknown" | "fail" | "progress" | "success";

export type StatusNode = Node<{
    title: string,
    state: StatusNodeState,
    description?: string,
    git?: GitMetadata
}, 'statusNode'>
