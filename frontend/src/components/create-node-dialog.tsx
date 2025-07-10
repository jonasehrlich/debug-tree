import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import type { ActionNode, StatusNode } from "@/types/nodes";
import type { AppState } from "@/types/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { statusNodeIconMap, statusNodeIconOptions } from "./status-icons";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  state: z.enum(["unknown", "progress", "fail", "success"]).optional(),
  gitRev: z
    .string()
    .regex(/[0-9a-fA-F]*/, {
      message: "Invalid Git revision",
    })
    .optional(),
});

const selector = (state: AppState) => ({
  nodes: state.nodes,
  pendingNode: state.pendingNodeData,
  setPendingNode: state.setPendingNodeData,
});

export const CreateNodeDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pendingNode, setPendingNode, nodes } = useStore(useShallow(selector));
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      state: "unknown",
      description: "",
      title: "",
      gitRev: "",
    },
  });

  useEffect(() => {
    if (pendingNode) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      // form.reset({ state: "unknown" });
      form.reset();
    }
  }, [pendingNode, form]);

  // const editNode = useStore((state) => state.editNode);
  // const setEditNodeData = useStore((state) => state.setEditNodeData);

  const { addNodes, addEdges, screenToFlowPosition } = useReactFlow();

  const submitForm = (values: z.infer<typeof formSchema>) => {
    if (pendingNode?.type === "actionNode") {
      const newNode: ActionNode = {
        id: `action-node-${crypto.randomUUID()}`,
        type: "actionNode",
        position: screenToFlowPosition(pendingNode.eventScreenPosition),
        data: {
          title: values.title,
          description: values.description ?? "",
        },
      };
      addNodes(newNode);
      if (pendingNode.fromNodeId) {
        addEdges({
          id: `edge-${crypto.randomUUID()}`,
          source: pendingNode.fromNodeId,
          target: newNode.id,
        });
      }
    } else if (pendingNode?.type === "statusNode") {
      const newNode: StatusNode = {
        id: `status-node-${crypto.randomUUID()}`,
        type: "statusNode",
        position: screenToFlowPosition(pendingNode.eventScreenPosition),
        data: {
          title: values.title,
          description: values.description ?? "",
          state: values.state ?? "unknown",
          git: {
            rev: values.gitRev ?? "",
          },
        },
      };
      addNodes(newNode);
      if (pendingNode.fromNodeId) {
        addEdges({
          id: `edge-${crypto.randomUUID()}`,
          source: pendingNode.fromNodeId,
          target: newNode.id,
        });
      }
    }
    setPendingNode(null);
  };

  if (pendingNode === null) {
    return <div></div>;
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && nodes.length == 0) {
          return;
        }
        setIsOpen(open);
      }}
    >
      <DialogContent
        className="md:max-w-[700px]"
        showCloseButton={nodes.length > 0}
      >
        <DialogHeader>
          <DialogTitle>
            New{" "}
            {pendingNode.type.charAt(0).toUpperCase() +
              pendingNode.type.replace("Node", "").slice(1)}{" "}
            Node
          </DialogTitle>
          <DialogDescription>Create a new node</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={form.handleSubmit(submitForm)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} autoComplete="off" />
                  </FormControl>
                </FormItem>
              )}
            />
            {pendingNode.type === "statusNode" && (
              <div className="space-y-8">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="flex gap-5">
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select
                          name="status"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {statusNodeIconOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="p-0 bg-popover"
                              >
                                <div
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2",
                                  )}
                                >
                                  <span>
                                    {statusNodeIconMap[option.value]}{" "}
                                  </span>
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gitRev"
                  render={({ field }) => (
                    <FormItem className="flex gap-5">
                      <FormLabel>Git Revision</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="off"
                          className="font-mono w-[180px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              {nodes.length > 0 && (
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              )}
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
