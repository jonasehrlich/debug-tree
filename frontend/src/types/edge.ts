export type EdgeType = "straight" | "step" | "smoothstep" | "default";
export const edgeTypes: EdgeType[] = [
  "straight",
  "step",
  "smoothstep",
  "default",
] as const;
