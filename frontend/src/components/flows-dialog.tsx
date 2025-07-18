import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStore, useUiStore } from "@/store";
import type { AppNode } from "@/types/nodes";
import type { AppState, UiState } from "@/types/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useReactFlow } from "@xyflow/react";
import { Trash } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { FilterableScrollArea } from "./filterable-scroll-area";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface FlowsDialogProps {
  // The element that triggers the dialog (e.g., a button).
  children: React.ReactNode;
  /// Ref to the reactflow component
  reactflowRef: React.Ref<HTMLDivElement>;
}

const formSchema = z.object({
  flowName: z.string().min(2, {
    message: "Flow name must be at least 2 characters.",
  }),
});

const selector = (s: AppState) => ({
  flows: s.flows,
  currentFlow: s.currentFlow,
  createFlow: s.createFlow,
  loadFlowsMetadata: s.loadFlowsMetadata,
  deleteFlow: s.deleteFlow,
  loadFlow: s.loadFlow,
  setPendingNode: s.setPendingNodeData,
  saveCurrentFlow: s.saveCurrentFlow,
});

export const FlowsDialog: React.FC<FlowsDialogProps> = ({
  children,
  reactflowRef,
}) => {
  const { isOpen, setIsOpen } = useUiStore(
    useShallow((s: UiState) => ({
      isOpen: s.isFlowsDialogOpen,
      setIsOpen: s.setIsFlowsDialogOpen,
    })),
  );

  const {
    flows,
    loadFlowsMetadata,
    currentFlow,
    loadFlow,
    createFlow,
    deleteFlow,
    setPendingNode,
    saveCurrentFlow,
  } = useStore(useShallow(selector));
  const [isFlowsLoading, setIsFlowsLoading] = useState(false);

  // Load flows when isOpen is changed to true
  useEffect(() => {
    if (isOpen) {
      setIsFlowsLoading(true);
      loadFlowsMetadata()
        .then(() => {
          setIsFlowsLoading(false);
        })
        .catch(() => {
          setIsFlowsLoading(false);
        });
    }
  }, [loadFlowsMetadata, isOpen]);

  // When current flow is set to null, open the dialog and close it automatically if a current
  // flow is set. This might trigger other useEffect hooks.
  useEffect(() => {
    if (currentFlow === null) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [setIsOpen, currentFlow]);

  useEffect(() => {
    if (isOpen) {
      saveCurrentFlow().catch(() => {
        // Close the dialog again, otherwise the dialog can be used to delete the currently opened flow
        setIsOpen(false);
      });
    }
  }, [isOpen, setIsOpen, saveCurrentFlow]);

  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [filterTerm, setFilterTerm] = useState<string>("");

  const onLoadFlowClick = () => {
    if (selectedFlow) {
      void loadFlow(selectedFlow);
    } else {
      toast.error("No flow selected");
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flowName: "",
    },
  });

  const { screenToFlowPosition } = useReactFlow<AppNode>();
  const onCreateFlow = async (values: z.infer<typeof formSchema>) => {
    if (
      !reactflowRef ||
      typeof reactflowRef !== "object" ||
      !("current" in reactflowRef) ||
      !reactflowRef.current
    ) {
      toast.error("No reactflow ref", {
        description:
          "Cannot create flow because positions for initial node is unknown",
      });
      return;
    }
    if (await createFlow(values.flowName)) {
      const bounds = reactflowRef.current.getBoundingClientRect();

      setPendingNode({
        type: "statusNode",
        eventScreenPosition: screenToFlowPosition({
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        }),
      });
      form.reset();
    }
  };

  const onDeleteFlowConfirm = async (id: string) => {
    await deleteFlow(id);
  };

  const onOpenChange = (open: boolean) => {
    if (!open && currentFlow === null) {
      // Don't allow closing the dialog if there is no currentFlow
      return;
    }
    setIsOpen(open);
    if (!open) {
      form.reset();
      setSelectedFlow(null);
    }
  };

  const filteredFlows = flows.filter((flow) =>
    flow.name.toLowerCase().includes(filterTerm.toLowerCase()),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px] p-0 overflow-hidden"
        showCloseButton={currentFlow !== null}
      >
        <div className="flex flex-col">
          {" "}
          {/* Top Section  */}
          <div className="p-6">
            {" "}
            <DialogHeader className="mb-4">
              <DialogTitle>Select a Flow to Open</DialogTitle>
              <DialogDescription>Select a flow to open</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <h4 className="mb-4 text-sm leading-none font-medium">Flows</h4>
              <FilterableScrollArea
                className="h-72 rounded-md border dark:bg-input/30 "
                filterTerm={filterTerm}
                setFilterTerm={setFilterTerm}
                placeholder="Filter"
              >
                {isFlowsLoading ? (
                  <>
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                  </>
                ) : filteredFlows.length > 0 ? (
                  filteredFlows.map((flow) => (
                    <div
                      key={flow.id}
                      className={cn(
                        "p-2 px-4 border-b cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/80 flex items-center justify-between text-sm select-none",
                        {
                          "bg-secondary": selectedFlow === flow.id,
                        },
                      )}
                      onClick={() => {
                        setSelectedFlow(
                          selectedFlow == flow.id ? null : flow.id,
                        );
                      }}
                      onDoubleClick={() => {
                        // Double click on the flow, load it directly
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        loadFlow(flow.id);
                      }}
                    >
                      {flow.name}{" "}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                          >
                            <Trash className="text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Flow</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogDescription>
                            Are you sure you want to delete this flow?
                          </AlertDialogDescription>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                                onDeleteFlowConfirm(flow.id);
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-2 text-muted-foreground">
                    No flows found.
                  </div>
                )}
              </FilterableScrollArea>{" "}
            </div>
            {/* --- SECTION ONE FOOTER --- */}
            <div className="pt-4 mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                type="submit"
                disabled={selectedFlow === null}
                onClick={onLoadFlowClick}
              >
                Open Flow
              </Button>
            </div>
          </div>
          {/* Bottom Section  */}
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Create a Flow</DialogTitle>
              <DialogDescription>Enter a name for the flow.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onSubmit={form.handleSubmit(onCreateFlow)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="flowName"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="off"
                              className="col-span-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="pt-4 mt-4 flex justify-end gap-2">
                  <Button
                    disabled={
                      !form.formState.isValid || form.formState.isSubmitting
                    }
                    type="submit"
                  >
                    Create Flow
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
