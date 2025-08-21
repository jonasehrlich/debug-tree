import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { keybindings } from "@/keybindings";
import { useUiStore } from "@/store";
import type { UiState } from "@/types/state";
import { Pin } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./ui/button";

const uIStoreSelector = (s: UiState) => ({
  isHelpDialogOpen: s.isHelpDialogOpen,
  setIsHelpDialogOpen: s.setIsHelpDialogOpen,
});

export const HelpDialog = () => {
  const { isHelpDialogOpen, setIsHelpDialogOpen } = useUiStore(
    useShallow(uIStoreSelector),
  );

  return (
    <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
      <DialogContent
        className="prose sm:max-w-2xl"
        aria-description="Help"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Help</DialogTitle>
        </DialogHeader>
        <h4>Create or open flow</h4>
        <p>
          Create a new debug-flow by either clicking the project entry in the
          menu bar or select <i>File &gt; Open / Create Flow</i>.
        </p>
        <p>
          This opens a new dialog which allows opening an existing flow or
          creating a new one.
        </p>

        <h4>Create a node</h4>
        <p>
          Create a node by pulling the edge from the handle of a node. This will
          create a pop-up to fill the initial node data and create the node.
        </p>

        <h4>Edit a node</h4>
        <p>
          Either double-click on a node or select <i>Edit</i> from the node
          header ellipsis menu.
        </p>

        <h4>Delete a node</h4>
        <p>
          Create a node by pressing <i>Delete</i> from the node header ellipsis
          menu. Or select a node and press the <i>Backspace</i> key.
        </p>

        <h4>Show Git Graph</h4>
        <p>
          For <i>StatusNodes</i> which have a Git reference assigned to them,
          click the <Pin className="bg-accent inline rounded-sm" size="1em" />{" "}
          icon in the footer of the node to pin the revision. A panel will
          appear in the lower-right corner of the screen. After a second
          revision is pinned, teh Git Graph can be displayed by clicking on the{" "}
          <i>Show Git Graph</i> button.
        </p>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const KeybindingsDialog = () => {
  const { isKeybindingsDialogOpen, setIsKeybindingsDialogOpen } = useUiStore(
    useShallow((s: UiState) => ({
      isKeybindingsDialogOpen: s.isKeybindingsDialogOpen,
      setIsKeybindingsDialogOpen: s.setIsKeybindingsDialogOpen,
    })),
  );

  return (
    <Dialog
      open={isKeybindingsDialogOpen}
      onOpenChange={setIsKeybindingsDialogOpen}
    >
      <DialogContent
        className="sm:max-w-2xl"
        aria-description="Keybindings"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Keybindings</DialogTitle>
        </DialogHeader>

        <div className="border-accent flex flex-col gap-4 p-2">
          {Object.entries(keybindings).map(([key, value]) => {
            return (
              <div key={key} className="flex items-center space-x-3">
                <kbd className="bg-accent min-w-12 rounded-md px-2 py-1 text-center text-sm">
                  {value.repr}
                </kbd>
                <div>{value.description}</div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
