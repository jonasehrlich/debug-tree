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
    repr: isMac ? "⌘s" : "^s",
    description: "Save the current flow",
  },
  open: {
    keys: `${isMac ? "Meta" : "Control"}+o`,
    repr: isMac ? "⌘o" : "^o",
    description: "Open a flow",
  },
};
