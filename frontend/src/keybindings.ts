interface Keybinding {
  keys: string;
  repr: string;
  description: string;
}
const isMac = (() => {
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
})();

export const keybindings: Record<string, Keybinding> = {
  save: {
    keys: `${isMac ? "Meta" : "Control"}+s`,
    repr: isMac ? "⌘S" : "^S",
    description: "Save the current flow",
  },
  open: {
    keys: `${isMac ? "Meta" : "Control"}+o`,
    repr: isMac ? "⌘O" : "^O",
    description: "Open a flow",
  },
  undo: {
    keys: `${isMac ? "Meta" : "Control"}+z`,
    repr: isMac ? "⌘Z" : "^Z",
    description: "Undo a modification",
  },
  redo: {
    keys: `${isMac ? "Meta" : "Control"}+Shift+z`,
    repr: isMac ? "⌘⇧Z" : "^⇧Z",
    description: "Redo a modification",
  },
} as const;
