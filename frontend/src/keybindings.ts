import { isApple } from "./lib/utils";

interface Keybinding {
  keys: string;
  repr: string;
  description: string;
}

export const keybindings: Record<string, Keybinding> = {
  save: {
    keys: `${isApple ? "Meta" : "Control"}+s`,
    repr: isApple ? "⌘S" : "^S",
    description: "Save the current flow",
  },
  open: {
    keys: `${isApple ? "Meta" : "Control"}+o`,
    repr: isApple ? "⌘O" : "^O",
    description: "Open a flow",
  },
  undo: {
    keys: `${isApple ? "Meta" : "Control"}+z`,
    repr: isApple ? "⌘Z" : "^Z",
    description: "Undo a modification",
  },
  redo: {
    keys: `${isApple ? "Meta" : "Control"}+Shift+z`,
    repr: isApple ? "⌘⇧Z" : "^⇧Z",
    description: "Redo a modification",
  },
} as const;
