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
import { Separator } from "./ui/separator";

const uIStoreSelector = (s: UiState) => ({
  isHelpDialogOpen: s.isHelpDialogOpen,
  setIsHelpDialogOpen: s.setIsHelpDialogOpen,
});

const HelpSection = ({
  title,
  content,
}: {
  title: string;
  content: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-4 border-accent">
      <h3 className="font-semibold">{title}</h3>

      <div className="text-muted-foreground">{content}</div>
      <Separator />
    </div>
  );
};

export const HelpDialog = () => {
  const { isHelpDialogOpen, setIsHelpDialogOpen } = useUiStore(
    useShallow(uIStoreSelector),
  );

  return (
    <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
      <DialogContent
        className="sm:max-w-[550px]"
        aria-description="Help"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Help</DialogTitle>
        </DialogHeader>
        <HelpSection
          title="Create or open flow"
          content={
            <div>
              <p>
                Create a new debug-flow by either clicking the project entry in
                the menu bar or select <i>File &gt; Open / Create Flow</i>.
              </p>
              <p>
                This opens a new dialog which allows opening an existing flow or
                creating a new one.
              </p>
            </div>
          }
        />
        <HelpSection
          title="Create a node"
          content={
            <p>
              Create a node by pulling the edge from the handle of a node. This
              will create a pop-up to fill the initial node data and create the
              node.
            </p>
          }
        />
        <HelpSection
          title="Edit a node"
          content={
            <p>
              Either double-click on a node or select <i>Edit</i> from the node
              header ellipsis menu.
            </p>
          }
        />
        <HelpSection
          title="Delete a node"
          content={
            <p>
              Create a node by pressing <i>Delete</i> from the node header
              ellipsis menu. Or select a node and press the <i>Backspace</i>
              key.
            </p>
          }
        />

        <HelpSection
          title="Show Git Graph"
          content={
            <p>
              For <i>StatusNodes</i> which have a Git reference assigned to
              them, click the{" "}
              <Pin className="inline bg-accent rounded-sm" size="1em" /> icon in
              the footer of the node to pin the revision. A panel will appear in
              the lower-right corner of the screen. After a second revision is
              pinned, teh Git Graph can be displayed by clicking on the{" "}
              <i>Show Git Graph</i> button.
            </p>
          }
        />
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
        className="sm:max-w-[550px]"
        aria-description="Keybindings"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Keybindings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 border-accent p-2">
          {Object.entries(keybindings).map(([key, value]) => {
            return (
              <div key={key} className="flex space-x-3 items-center">
                <span className="font-mono px-2 py-1 bg-accent rounded-md min-w-12 text-center text-sm">
                  {value.repr}
                </span>
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
