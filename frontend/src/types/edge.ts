export type EdgeType = "straight" | "step" | "smoothstep" | "bezier";
export const edgeTypes: EdgeType[] = [
  "straight",
  "step",
  "smoothstep",
  "bezier",
] as const;
